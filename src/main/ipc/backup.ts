import { readFile, writeFile } from 'fs/promises'
import { basename, join } from 'path'
import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import type {
  BackupExportKind,
  BackupExportResponse,
  BackupImportRequest,
  BackupImportResponse,
  BackupParseErrorCode,
  BackupPreviewResponse
} from '../../shared/types/backup'
import {
  BackupParseError,
  applyBackupImport,
  buildBackupFile,
  buildBackupPreview,
  parseBackupFile
} from '../../shared/utils/backup'
import {
  getGroups,
  getProxies,
  getSettings,
  saveGroups,
  saveProxies,
  saveSettings
} from '../services/app-store'
import { refreshTrayContextMenu } from '../services/tray'
import { notifyTrayDataChanged, syncTrayEnabled } from './tray'

function getActiveWindow(): BrowserWindow | undefined {
  return BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
}

function formatBackupFileName(kind: BackupExportKind): string {
  const date = new Date().toISOString().slice(0, 10)
  return `proxychecker-backup-${kind}-${date}.pcbackup.json`
}

const OPEN_DIALOG_OPTIONS = {
  title: 'Import ProxyChecker backup',
  properties: ['openFile'] as Array<'openFile'>,
  filters: [{ name: 'ProxyChecker Backup', extensions: ['json'] }]
}

async function readAppVersion(): Promise<string> {
  const packageContent = await readFile(join(app.getAppPath(), 'package.json'), 'utf-8')
  const packageJson = JSON.parse(packageContent) as { version?: string }
  return packageJson.version ?? '0.0.0'
}

async function persistImportedSettings(previousTrayEnabled: boolean, previousLanguage: string): Promise<void> {
  const settings = await getSettings()

  if (previousTrayEnabled !== settings.trayEnabled) {
    await syncTrayEnabled(settings.trayEnabled)
    return
  }

  if (settings.trayEnabled && previousLanguage !== settings.language) {
    await refreshTrayContextMenu()
  }
}

async function pickBackupFile(): Promise<{ canceled: true } | { canceled: false; filePath: string }> {
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
  ipcMain.handle(
    'backup:export',
    async (_event, kind: BackupExportKind): Promise<BackupExportResponse> => {
      const window = getActiveWindow()
      const dialogOptions = {
        title: 'Export ProxyChecker backup',
        defaultPath: formatBackupFileName(kind),
        filters: [{ name: 'ProxyChecker Backup', extensions: ['json'] }]
      }
      const dialogResult = window
        ? await dialog.showSaveDialog(window, dialogOptions)
        : await dialog.showSaveDialog(dialogOptions)

      if (dialogResult.canceled || !dialogResult.filePath) {
        return { canceled: true }
      }

      const [proxies, groups, settings, appVersion] = await Promise.all([
        getProxies(),
        getGroups(),
        getSettings(),
        readAppVersion()
      ])

      const content = buildBackupFile({
        kind,
        proxies,
        groups,
        settings,
        appVersion
      })

      await writeFile(dialogResult.filePath, content, 'utf-8')
      return { canceled: false, filePath: dialogResult.filePath }
    }
  )

  ipcMain.handle('backup:preview', async (): Promise<BackupPreviewResponse> => {
    const picked = await pickBackupFile()

    if (picked.canceled) {
      return { canceled: true }
    }

    try {
      const content = await readFile(picked.filePath, 'utf-8')
      const backup = parseBackupFile(content)

      return {
        canceled: false,
        preview: buildBackupPreview(backup, picked.filePath, basename(picked.filePath))
      }
    } catch (error) {
      return { canceled: false, error: serializeBackupError(error) }
    }
  })

  ipcMain.handle(
    'backup:import',
    async (_event, request: BackupImportRequest): Promise<BackupImportResponse> => {
      try {
        const content = await readFile(request.filePath, 'utf-8')
        const backup = parseBackupFile(content)

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
          request.mode
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

        return { canceled: false, result }
      } catch (error) {
        return { canceled: false, error: serializeBackupError(error) }
      }
    }
  )
}
