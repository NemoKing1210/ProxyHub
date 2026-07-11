import { app } from 'electron'
import { autoUpdater, type UpdateInfo } from 'electron-updater'
import { is } from '@electron-toolkit/utils'
import type { AppUpdateState } from '../../shared/types/updater'
import { resolveUpdateErrorCode } from '../../shared/utils/update-error'
import { getMainWindow } from './main-window'
import { showNativeNotification } from './notifications'

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
  getMainWindow()?.webContents.send('updater:state-changed', state)
}

function patchState(patch: Partial<AppUpdateState>): void {
  state = { ...state, ...patch }
  emitState()
}

function resetProgress(): void {
  patchState({
    downloadPercent: undefined,
    transferredBytes: undefined,
    totalBytes: undefined,
    bytesPerSecond: undefined
  })
}

function applyAvailableUpdate(info: UpdateInfo): void {
  patchState({
    status: 'available',
    availableVersion: info.version,
    releaseNotes: formatReleaseNotes(info.releaseNotes),
    error: undefined,
    errorCode: undefined
  })
}

function applyUpdateError(error: Error): void {
  patchState({
    status: 'error',
    error: error.message,
    errorCode: resolveUpdateErrorCode(error.message)
  })
}

function notifyUpdateAvailable(version: string): void {
  showNativeNotification({
    title: 'ProxyChecker update available',
    body: `Version ${version} is ready to download. Open Settings → About to update.`
  })
}

export function getUpdateState(): AppUpdateState {
  return state
}

export function initializeAutoUpdater(): void {
  if (initialized || !isAutoUpdateEnabled()) {
    return
  }

  initialized = true
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.allowDowngrade = false

  autoUpdater.on('checking-for-update', () => {
    patchState({ status: 'checking', error: undefined, errorCode: undefined })
  })

  autoUpdater.on('update-available', (info) => {
    applyAvailableUpdate(info)
  })

  autoUpdater.on('update-not-available', () => {
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
    patchState({
      status: 'downloading',
      downloadPercent: progress.percent,
      transferredBytes: progress.transferred,
      totalBytes: progress.total,
      bytesPerSecond: progress.bytesPerSecond
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
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
    applyUpdateError(error)
  })
}

export function scheduleStartupUpdateCheck(delayMs = 8000): void {
  if (!isAutoUpdateEnabled()) {
    return
  }

  setTimeout(() => {
    void checkForUpdates({ notifyOnAvailable: true })
  }, delayMs)
}

export async function checkForUpdates(options?: {
  notifyOnAvailable?: boolean
}): Promise<AppUpdateState> {
  if (!isAutoUpdateEnabled()) {
    state = createBaseState()
    emitState()
    return state
  }

  if (!initialized) {
    initializeAutoUpdater()
  }

  if (checkInFlight) {
    await checkInFlight
    return state
  }

  patchState({ status: 'checking', error: undefined, errorCode: undefined })

  checkInFlight = autoUpdater
    .checkForUpdates()
    .then((result) => {
      if (result?.updateInfo && result.isUpdateAvailable) {
        applyAvailableUpdate(result.updateInfo)

        if (options?.notifyOnAvailable) {
          notifyUpdateAvailable(result.updateInfo.version)
        }
      }
    })
    .catch((error: Error) => {
      applyUpdateError(error)
    })
    .finally(() => {
      checkInFlight = null
    })

  await checkInFlight
  return state
}

export async function downloadUpdate(): Promise<AppUpdateState> {
  if (!isAutoUpdateEnabled()) {
    return state
  }

  if (state.status !== 'available' && state.status !== 'error') {
    return state
  }

  if (downloadInFlight) {
    await downloadInFlight
    return state
  }

  patchState({ status: 'downloading', error: undefined, errorCode: undefined })

  downloadInFlight = autoUpdater
    .downloadUpdate()
    .then(() => undefined)
    .catch((error: Error) => {
      applyUpdateError(error)
    })
    .finally(() => {
      downloadInFlight = null
    })

  await downloadInFlight
  return state
}

export function quitAndInstallUpdate(): void {
  if (!isAutoUpdateEnabled() || state.status !== 'downloaded') {
    return
  }

  autoUpdater.quitAndInstall()
}
