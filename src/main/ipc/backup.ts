import { readFile, writeFile } from 'fs/promises'
import { basename } from 'path'
import { BrowserWindow, dialog, ipcMain } from 'electron'
import type {
  BackupExportKind,
  BackupExportRequest,
  BackupExportResponse,
  BackupImportRequest,
  BackupImportResponse,
  BackupParseErrorCode,
  BackupPreviewResponse,
  BackupUnlockPreviewRequest
} from '@shared/types/backup'
import {
  BackupParseError,
  applyBackupImport,
  buildBackupPreview,
  buildLockedBackupPreview,
  isEncryptedBackupFile,
  parseBackupEnvelopeFromContent,
  resolveBackupExportProxies
} from '@shared/utils/backup'
import { createBackupContent, loadBackupFile, readAppVersion } from '../services/backup-content'
import {
  getGroups,
  getProxies,
  getSettings,
  saveGroups,
  saveProxies,
  saveSettings
} from '../services/app-store'
import { refreshTrayContextMenu } from '../services/tray'
import { logger } from '../services/logger'
import { notifyTrayDataChanged, syncTrayEnabled } from './tray'
function getActiveWindow(): BrowserWindow | undefined {
  return BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
}

function formatBackupFileName(kind: BackupExportKind): string {
  const date = new Date().toISOString().slice(0, 10)
  return `proxyhub-backup-${kind}-${date}.pcbackup.json`
}

const OPEN_DIALOG_OPTIONS = {
  title: 'Import ProxyHub backup',
  properties: ['openFile'] as Array<'openFile'>,
  filters: [{ name: 'ProxyHub Backup', extensions: ['json'] }]
}

async function persistImportedSettings(
  previousTrayEnabled: boolean,
  previousLanguage: string
): Promise<void> {
  const settings = await getSettings()

  if (previousTrayEnabled !== settings.trayEnabled) {
    await syncTrayEnabled(settings.trayEnabled)
    return
  }

  if (settings.trayEnabled && previousLanguage !== settings.language) {
    await refreshTrayContextMenu()
  }
}

async function pickBackupFile(): Promise<
  { canceled: true } | { canceled: false; filePath: string }
> {
  const window = getActiveWindow()
  const dialogResult = window
    ? await dialog.showOpenDialog(window, OPEN_DIALOG_OPTIONS)
    : await dialog.showOpenDialog(OPEN_DIALOG_OPTIONS)

  if (dialogResult.canceled || dialogResult.filePaths.length === 0) {
    return { canceled: true }
  }

  return { canceled: false, filePath: dialogResult.filePaths[0] }
}

export function serializeBackupError(error: unknown): {
  code: BackupParseErrorCode | 'unknown'
  message: string
} {
  if (error instanceof BackupParseError) {
    return { code: error.code, message: error.message }
  }

  if (error instanceof Error) {
    return { code: 'unknown', message: error.message }
  }

  return { code: 'unknown', message: 'Unknown import error' }
}

export function registerBackupIpc(): void {
  const log = logger.scope('ipc:backup')

  ipcMain.handle(
    'backup:export',
    async (_event, request: BackupExportRequest): Promise<BackupExportResponse> => {
      log.info('backup:export invoked', {
        kind: request.kind,
        proxyIdsCount: request.proxyIds?.length,
        hasPassword: !!request.password
      })
      try {
        const kind = request.kind
        const window = getActiveWindow()
        const dialogOptions = {
          title: 'Export ProxyHub backup',
          defaultPath: formatBackupFileName(kind),
          filters: [{ name: 'ProxyHub Backup', extensions: ['json'] }]
        }
        const dialogResult = window
          ? await dialog.showSaveDialog(window, dialogOptions)
          : await dialog.showSaveDialog(dialogOptions)

        if (dialogResult.canceled || !dialogResult.filePath) {
          log.debug('backup:export canceled')
          return { canceled: true }
        }

        const [proxies, groups, settings, appVersion] = await Promise.all([
          getProxies(),
          getGroups(),
          getSettings(),
          readAppVersion()
        ])

        const exportData = resolveBackupExportProxies(proxies, groups, request.proxyIds)

        const content = createBackupContent({
          kind,
          proxies: exportData.proxies,
          groups: exportData.groups,
          settings,
          appVersion,
          password: request.password
        })

        await writeFile(dialogResult.filePath, content, 'utf-8')
        log.debug('backup:export succeeded', { filePath: dialogResult.filePath })
        return { canceled: false, filePath: dialogResult.filePath }
      } catch (error) {
        log.error('backup:export failed', error)
        throw error
      }
    }
  )

  ipcMain.handle('backup:preview', async (): Promise<BackupPreviewResponse> => {
    log.info('backup:preview invoked')
    try {
      const picked = await pickBackupFile()

      if (picked.canceled) {
        log.debug('backup:preview canceled')
        return { canceled: true }
      }

      try {
        const content = await readFile(picked.filePath, 'utf-8')
        const envelope = parseBackupEnvelopeFromContent(content)

        if (isEncryptedBackupFile(envelope)) {
          const result = {
            canceled: false as const,
            preview: buildLockedBackupPreview(envelope, picked.filePath, basename(picked.filePath))
          }
          log.debug('backup:preview succeeded (locked)', { fileName: basename(picked.filePath) })
          return result
        }

        const backup = loadBackupFile(content)

        const result = {
          canceled: false as const,
          preview: buildBackupPreview(backup, picked.filePath, basename(picked.filePath))
        }
        log.debug('backup:preview succeeded', { fileName: basename(picked.filePath) })
        return result
      } catch (error) {
        log.error('backup:preview parse failed', error)
        return { canceled: false, error: serializeBackupError(error) }
      }
    } catch (error) {
      log.error('backup:preview failed', error)
      throw error
    }
  })

  ipcMain.handle(
    'backup:unlock-preview',
    async (_event, request: BackupUnlockPreviewRequest): Promise<BackupPreviewResponse> => {
      log.info('backup:unlock-preview invoked', {
        filePath: request.filePath,
        hasPassword: !!request.password
      })
      try {
        try {
          const content = await readFile(request.filePath, 'utf-8')
          const envelope = parseBackupEnvelopeFromContent(content)

          if (!isEncryptedBackupFile(envelope)) {
            const backup = loadBackupFile(content)
            const result = {
              canceled: false as const,
              preview: buildBackupPreview(backup, request.filePath, basename(request.filePath))
            }
            log.debug('backup:unlock-preview succeeded (not encrypted)')
            return result
          }

          const backup = loadBackupFile(content, request.password)

          const result = {
            canceled: false as const,
            preview: buildBackupPreview(backup, request.filePath, basename(request.filePath), {
              encrypted: true,
              decrypted: true,
              envelopeKind: envelope.payloadKind,
              schemaVersion: envelope.version
            })
          }
          log.debug('backup:unlock-preview succeeded')
          return result
        } catch (error) {
          log.error('backup:unlock-preview parse failed', error)
          return { canceled: false, error: serializeBackupError(error) }
        }
      } catch (error) {
        log.error('backup:unlock-preview failed', error)
        throw error
      }
    }
  )

  ipcMain.handle(
    'backup:import',
    async (_event, request: BackupImportRequest): Promise<BackupImportResponse> => {
      log.info('backup:import invoked', {
        filePath: request.filePath,
        mode: request.mode,
        proxyIdsCount: request.proxyIds?.length,
        hasPassword: !!request.password
      })
      try {
        try {
          const content = await readFile(request.filePath, 'utf-8')
          const backup = loadBackupFile(content, request.password)

          const [proxies, groups, settings] = await Promise.all([
            getProxies(),
            getGroups(),
            getSettings()
          ])

          const previousTrayEnabled = settings.trayEnabled
          const previousLanguage = settings.language
          const { data, result } = applyBackupImport(
            backup,
            { proxies, groups, settings },
            request.mode,
            request.proxyIds
          )

          const includesProxies = result.kind === 'full' || result.kind === 'proxies'
          const includesSettings = result.kind === 'full' || result.kind === 'settings'

          if (includesProxies) {
            await saveGroups(data.groups)
            await saveProxies(data.proxies)
            notifyTrayDataChanged()
          }

          if (includesSettings) {
            await saveSettings(data.settings)
            await persistImportedSettings(previousTrayEnabled, previousLanguage)
          }

          log.debug('backup:import succeeded', { kind: result.kind })
          return { canceled: false, result }
        } catch (error) {
          log.error('backup:import parse/apply failed', error)
          return { canceled: false, error: serializeBackupError(error) }
        }
      } catch (error) {
        log.error('backup:import failed', error)
        throw error
      }
    }
  )
}
