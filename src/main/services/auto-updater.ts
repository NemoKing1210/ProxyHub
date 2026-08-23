import { app } from 'electron'
import { autoUpdater, type UpdateInfo } from 'electron-updater'
import { is } from '@electron-toolkit/utils'
import type { AppUpdateState } from '@shared/types/updater'
import { resolveUpdateErrorCode } from '@shared/utils/update-error'
import { getMainWindow } from './main-window'
import { showNativeNotification } from './notifications'
import { logger } from './logger'

const log = logger.scope('updater')

function isAutoUpdateEnabled(): boolean {
  return !is.dev && app.isPackaged
}

function formatReleaseNotes(
  notes: string | Array<{ version: string; note?: string | null }> | null | undefined
): string | undefined {
  if (!notes) {
    return undefined
  }

  if (typeof notes === 'string') {
    return notes.trim() || undefined
  }

  const formatted = notes
    .map((entry) => {
      const body = typeof entry.note === 'string' ? entry.note.trim() : ''
      return body ? `## ${entry.version}\n${body}` : `## ${entry.version}`
    })
    .join('\n\n')
    .trim()

  return formatted || undefined
}

function createBaseState(): AppUpdateState {
  return {
    status: isAutoUpdateEnabled() ? 'idle' : 'disabled',
    currentVersion: app.getVersion()
  }
}

let state: AppUpdateState = createBaseState()
let initialized = false
let checkInFlight: Promise<void> | null = null
let downloadInFlight: Promise<void> | null = null

function emitState(): void {
  log.debug('Emit updater state', {
    status: state.status,
    version: state.currentVersion,
    available: state.availableVersion
  })
  try {
    getMainWindow()?.webContents.send('updater:state-changed', state)
  } catch (error) {
    log.error('Failed to emit updater state', error)
  }
}

function patchState(patch: Partial<AppUpdateState>): void {
  const prev = state.status
  state = { ...state, ...patch }
  log.debug('Updater state transition', { from: prev, to: state.status, patch })
  emitState()
}

function resetProgress(): void {
  log.debug('Reset updater progress')
  patchState({
    downloadPercent: undefined,
    transferredBytes: undefined,
    totalBytes: undefined,
    bytesPerSecond: undefined
  })
}

function applyAvailableUpdate(info: UpdateInfo): void {
  log.info('Update available', { version: info.version })
  patchState({
    status: 'available',
    availableVersion: info.version,
    releaseNotes: formatReleaseNotes(info.releaseNotes),
    error: undefined,
    errorCode: undefined
  })
}

function applyUpdateError(error: Error): void {
  log.error('Updater error', error)
  patchState({
    status: 'error',
    error: error.message,
    errorCode: resolveUpdateErrorCode(error.message)
  })
}

function notifyUpdateAvailable(version: string): void {
  log.info('Notifying update available', { version })
  showNativeNotification({
    title: 'ProxyHub update available',
    body: `Version ${version} is ready to download. Open Settings → About to update.`
  })
}

export function getUpdateState(): AppUpdateState {
  return state
}

export function initializeAutoUpdater(): void {
  if (initialized) {
    log.debug('Auto updater already initialized')
    return
  }
  if (!isAutoUpdateEnabled()) {
    log.info('Auto updater disabled (dev or unpackaged)', {
      isDev: is.dev,
      isPackaged: app.isPackaged
    })
    return
  }

  log.info('Initializing auto updater')
  initialized = true
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.allowDowngrade = false

  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for update')
    patchState({ status: 'checking', error: undefined, errorCode: undefined })
  })

  autoUpdater.on('update-available', (info) => {
    log.info('Update available event', { version: info.version })
    applyAvailableUpdate(info)
  })

  autoUpdater.on('update-not-available', () => {
    log.info('Update not available')
    patchState({
      status: 'not-available',
      availableVersion: undefined,
      releaseNotes: undefined,
      error: undefined,
      errorCode: undefined
    })
    resetProgress()
  })

  autoUpdater.on('download-progress', (progress) => {
    log.debug('Download progress', {
      percent: progress.percent,
      transferred: progress.transferred,
      total: progress.total,
      bytesPerSecond: progress.bytesPerSecond
    })
    patchState({
      status: 'downloading',
      downloadPercent: progress.percent,
      transferredBytes: progress.transferred,
      totalBytes: progress.total,
      bytesPerSecond: progress.bytesPerSecond
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded', { version: info.version })
    patchState({
      status: 'downloaded',
      availableVersion: info.version,
      releaseNotes: formatReleaseNotes(info.releaseNotes),
      downloadPercent: 100,
      error: undefined,
      errorCode: undefined
    })
  })

  autoUpdater.on('error', (error) => {
    log.error('Auto updater error event', error)
    applyUpdateError(error)
  })
  log.info('Auto updater initialized')
}

export function scheduleStartupUpdateCheck(delayMs = 8000): void {
  if (!isAutoUpdateEnabled()) {
    log.debug('Skipping startup update check (disabled)')
    return
  }

  log.info('Scheduling startup update check', { delayMs })
  setTimeout(() => {
    log.debug('Running scheduled startup update check')
    void checkForUpdates({ notifyOnAvailable: true }).catch((error) => {
      log.error('Startup update check failed', error)
    })
  }, delayMs)
}

export async function checkForUpdates(options?: {
  notifyOnAvailable?: boolean
}): Promise<AppUpdateState> {
  log.info('checkForUpdates called', { notifyOnAvailable: options?.notifyOnAvailable })
  if (!isAutoUpdateEnabled()) {
    log.debug('checkForUpdates: auto update disabled, returning base state')
    state = createBaseState()
    emitState()
    return state
  }

  if (!initialized) {
    log.debug('checkForUpdates: initializing auto updater lazily')
    initializeAutoUpdater()
  }

  if (checkInFlight) {
    log.debug('checkForUpdates: already in flight, awaiting')
    await checkInFlight
    return state
  }

  patchState({ status: 'checking', error: undefined, errorCode: undefined })

  checkInFlight = autoUpdater
    .checkForUpdates()
    .then((result) => {
      if (result?.updateInfo && result.isUpdateAvailable) {
        log.info('Update is available', { version: result.updateInfo.version })
        applyAvailableUpdate(result.updateInfo)

        if (options?.notifyOnAvailable) {
          notifyUpdateAvailable(result.updateInfo.version)
        }
      } else {
        log.info('No update available')
      }
    })
    .catch((error: Error) => {
      log.error('checkForUpdates failed', error)
      applyUpdateError(error)
    })
    .finally(() => {
      checkInFlight = null
      log.debug('checkForUpdates completed', { status: state.status })
    })

  await checkInFlight
  return state
}

export async function downloadUpdate(): Promise<AppUpdateState> {
  log.info('downloadUpdate called', { status: state.status })
  if (!isAutoUpdateEnabled()) {
    log.warn('downloadUpdate: auto update disabled')
    return state
  }

  if (state.status !== 'available' && state.status !== 'error') {
    log.warn('downloadUpdate: invalid state', { status: state.status })
    return state
  }

  if (downloadInFlight) {
    log.debug('downloadUpdate: already in flight')
    await downloadInFlight
    return state
  }

  patchState({ status: 'downloading', error: undefined, errorCode: undefined })

  downloadInFlight = autoUpdater
    .downloadUpdate()
    .then(() => {
      log.info('Download completed')
      return undefined
    })
    .catch((error: Error) => {
      log.error('downloadUpdate failed', error)
      applyUpdateError(error)
    })
    .finally(() => {
      downloadInFlight = null
      log.debug('downloadUpdate completed', { status: state.status })
    })

  await downloadInFlight
  return state
}

export function quitAndInstallUpdate(): void {
  log.info('quitAndInstallUpdate called', { status: state.status })
  if (!isAutoUpdateEnabled() || state.status !== 'downloaded') {
    log.warn('quitAndInstallUpdate: not ready', { status: state.status })
    return
  }

  try {
    log.info('Quitting and installing update', { version: state.availableVersion })
    autoUpdater.quitAndInstall()
  } catch (error) {
    log.error('Failed to quit and install update', error)
    throw error
  }
}
