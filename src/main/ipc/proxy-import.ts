import { readFile, writeFile } from 'fs/promises'
import { basename } from 'path'
import { BrowserWindow, dialog, ipcMain } from 'electron'
import type {
  CsvExportRequest,
  CsvExportResponse,
  CsvImportError,
  CsvImportPreviewResponse,
  CsvImportRequest,
  CsvImportResponse
} from '../../shared/types/proxy-import'
import type { Proxy } from '../../shared/types/proxy'
import {
  applyCsvImport,
  buildCsvImportPreviewEntries,
  formatProxyImportCsv
} from '../../shared/utils/proxy-import'
import { getGroups, getProxies, saveProxies } from '../services/app-store'
import { notifyTrayDataChanged } from './tray'

function getActiveWindow(): BrowserWindow | undefined {
  return BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
}

const CSV_OPEN_DIALOG_OPTIONS = {
  title: 'Import proxy CSV',
  properties: ['openFile'] as Array<'openFile'>,
  filters: [{ name: 'CSV proxy list', extensions: ['csv', 'txt'] }]
}

const CSV_SAVE_DIALOG_OPTIONS = {
  title: 'Export proxy CSV',
  defaultPath: 'proxy-list.csv',
  filters: [{ name: 'CSV proxy list', extensions: ['csv'] }]
}

function serializeCsvError(error: unknown): CsvImportError {
  if (error instanceof Error) {
    return { code: 'unknown', message: error.message }
  }

  return { code: 'unknown', message: 'Unknown CSV import error' }
}

async function pickCsvFile(): Promise<{ canceled: true } | { canceled: false; filePath: string }> {
  const window = getActiveWindow()
  const dialogResult = window
    ? await dialog.showOpenDialog(window, CSV_OPEN_DIALOG_OPTIONS)
    : await dialog.showOpenDialog(CSV_OPEN_DIALOG_OPTIONS)

  if (dialogResult.canceled || dialogResult.filePaths.length === 0) {
    return { canceled: true }
  }

  return { canceled: false, filePath: dialogResult.filePaths[0] }
}

function resolveExportProxies(proxies: Proxy[], proxyIds: string[]): Proxy[] {
  const selectedIds = new Set(proxyIds)
  return proxies.filter((proxy) => selectedIds.has(proxy.id))
}

export function registerProxyImportIpc(): void {
  ipcMain.handle('csv:preview', async (): Promise<CsvImportPreviewResponse> => {
    const picked = await pickCsvFile()

    if (picked.canceled) {
      return { canceled: true }
    }

    try {
      const content = await readFile(picked.filePath, 'utf-8')

      if (!content.trim()) {
        return {
          canceled: false,
          error: { code: 'empty_file', message: 'CSV file is empty' }
        }
      }

      const existingProxies = await getProxies()
      const { entries, invalidLineCount, totalLineCount } = buildCsvImportPreviewEntries(
        content,
        existingProxies
      )

      if (entries.length === 0) {
        return {
          canceled: false,
          error: { code: 'no_valid_entries', message: 'No valid proxy entries found in CSV file' }
        }
      }

      return {
        canceled: false,
        preview: {
          filePath: picked.filePath,
          fileName: basename(picked.filePath),
          entries,
          invalidLineCount,
          totalLineCount
        }
      }
    } catch (error) {
      return {
        canceled: false,
        error: { code: 'read_error', message: serializeCsvError(error).message }
      }
    }
  })

  ipcMain.handle('csv:import', async (_event, request: CsvImportRequest): Promise<CsvImportResponse> => {
    try {
      const content = await readFile(request.filePath, 'utf-8')
      const [existingProxies, groups] = await Promise.all([getProxies(), getGroups()])

      if (request.groupId && !groups.some((group) => group.id === request.groupId)) {
        return {
          canceled: false,
          error: { code: 'unknown', message: 'Selected group no longer exists' }
        }
      }

      const { proxies, result } = applyCsvImport(
        content,
        existingProxies,
        request.entryIds,
        request.groupId
      )

      if (result.added > 0) {
        await saveProxies(proxies)
        notifyTrayDataChanged()
      }

      return { canceled: false, result }
    } catch (error) {
      return { canceled: false, error: serializeCsvError(error) }
    }
  })

  ipcMain.handle('csv:export', async (_event, request: CsvExportRequest): Promise<CsvExportResponse> => {
    const window = getActiveWindow()
    const dialogResult = window
      ? await dialog.showSaveDialog(window, CSV_SAVE_DIALOG_OPTIONS)
      : await dialog.showSaveDialog(CSV_SAVE_DIALOG_OPTIONS)

    if (dialogResult.canceled || !dialogResult.filePath) {
      return { canceled: true }
    }

    const proxies = await getProxies()
    const exportProxies = resolveExportProxies(proxies, request.proxyIds)
    const content = formatProxyImportCsv(exportProxies)

    await writeFile(dialogResult.filePath, content, 'utf-8')
    return { canceled: false, filePath: dialogResult.filePath }
  })
}
