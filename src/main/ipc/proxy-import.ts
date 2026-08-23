import { readFile, writeFile } from 'fs/promises'
import { basename } from 'path'
import { BrowserWindow, dialog, ipcMain } from 'electron'
import type {
  ProxyListExportRequest,
  ProxyListExportResponse,
  ProxyListImportError,
  ProxyListImportPreviewResponse,
  ProxyListImportRequest,
  ProxyListImportResponse,
  ProxyListImportFormat
} from '@shared/types/proxy-import'
import type { Proxy } from '@shared/types/proxy'
import {
  applyProxyListImport,
  buildProxyListImportPreviewEntries,
  formatProxyImportCsv,
  formatProxyImportJson,
  formatProxyImportTxt,
  parseProxyImportCsv,
  parseProxyImportJson,
  parseProxyImportTxt,
  type ParseProxyImportListResult
} from '@shared/utils/proxy-import'
import { getGroups, getProxies, saveProxies } from '../services/app-store'
import { notifyTrayDataChanged } from './tray'

function getActiveWindow(): BrowserWindow | undefined {
  return BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
}

const LIST_FORMAT_CONFIG: Record<
  ProxyListImportFormat,
  {
    openTitle: string
    openFilterName: string
    openExtensions: string[]
    saveTitle: string
    saveExtensions: string[]
    emptyMessage: string
    noEntriesMessage: string
    parse: (content: string) => ParseProxyImportListResult
    format: (
      proxies: Array<
        Pick<Proxy, 'host' | 'port' | 'protocol' | 'anonymityLevel' | 'countryCode' | 'city'>
      >
    ) => string
  }
> = {
  csv: {
    openTitle: 'Import proxy CSV',
    openFilterName: 'CSV proxy list',
    openExtensions: ['csv'],
    saveTitle: 'Export proxy CSV',
    saveExtensions: ['csv'],
    emptyMessage: 'CSV file is empty',
    noEntriesMessage: 'No valid proxy entries found in CSV file',
    parse: parseProxyImportCsv,
    format: formatProxyImportCsv
  },
  json: {
    openTitle: 'Import proxy JSON',
    openFilterName: 'JSON proxy list',
    openExtensions: ['json'],
    saveTitle: 'Export proxy JSON',
    saveExtensions: ['json'],
    emptyMessage: 'JSON file is empty',
    noEntriesMessage: 'No valid proxy entries found in JSON file',
    parse: parseProxyImportJson,
    format: formatProxyImportJson
  },
  txt: {
    openTitle: 'Import proxy TXT',
    openFilterName: 'TXT proxy list',
    openExtensions: ['txt'],
    saveTitle: 'Export proxy TXT',
    saveExtensions: ['txt'],
    emptyMessage: 'TXT file is empty',
    noEntriesMessage: 'No valid proxy entries found in TXT file',
    parse: parseProxyImportTxt,
    format: formatProxyImportTxt
  }
}

function formatListExportFileName(format: ProxyListImportFormat): string {
  const date = new Date().toISOString().slice(0, 10)
  const extension = LIST_FORMAT_CONFIG[format].saveExtensions[0]
  return `proxy-list-${date}.${extension}`
}

function serializeListImportError(
  error: unknown,
  format: ProxyListImportFormat
): ProxyListImportError {
  if (error instanceof Error) {
    if (error.message === 'invalid_json' && format === 'json') {
      return { code: 'invalid_json', message: error.message }
    }

    return { code: 'unknown', message: error.message }
  }

  return { code: 'unknown', message: `Unknown ${format.toUpperCase()} import error` }
}

async function pickListImportFile(
  format: ProxyListImportFormat
): Promise<{ canceled: true } | { canceled: false; filePath: string }> {
  const config = LIST_FORMAT_CONFIG[format]
  const window = getActiveWindow()
  const dialogOptions = {
    title: config.openTitle,
    properties: ['openFile'] as Array<'openFile'>,
    filters: [{ name: config.openFilterName, extensions: config.openExtensions }]
  }
  const dialogResult = window
    ? await dialog.showOpenDialog(window, dialogOptions)
    : await dialog.showOpenDialog(dialogOptions)

  if (dialogResult.canceled || dialogResult.filePaths.length === 0) {
    return { canceled: true }
  }

  return { canceled: false, filePath: dialogResult.filePaths[0] }
}

function resolveExportProxies(proxies: Proxy[], proxyIds: string[]): Proxy[] {
  const selectedIds = new Set(proxyIds)
  return proxies.filter((proxy) => selectedIds.has(proxy.id))
}

async function previewListImport(
  format: ProxyListImportFormat
): Promise<ProxyListImportPreviewResponse> {
  const config = LIST_FORMAT_CONFIG[format]
  const picked = await pickListImportFile(format)

  if (picked.canceled) {
    return { canceled: true }
  }

  try {
    const content = await readFile(picked.filePath, 'utf-8')

    if (!content.trim()) {
      return {
        canceled: false,
        error: { code: 'empty_file', message: config.emptyMessage }
      }
    }

    const existingProxies = await getProxies()
    const parsed = config.parse(content)
    const { entries, invalidLineCount, totalLineCount } = buildProxyListImportPreviewEntries(
      parsed,
      existingProxies
    )

    if (entries.length === 0) {
      return {
        canceled: false,
        error: { code: 'no_valid_entries', message: config.noEntriesMessage }
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
      error: serializeListImportError(error, format)
    }
  }
}

async function importList(
  format: ProxyListImportFormat,
  request: ProxyListImportRequest
): Promise<ProxyListImportResponse> {
  const config = LIST_FORMAT_CONFIG[format]

  try {
    const content = await readFile(request.filePath, 'utf-8')
    const [existingProxies, groups] = await Promise.all([getProxies(), getGroups()])

    if (request.groupId && !groups.some((group) => group.id === request.groupId)) {
      return {
        canceled: false,
        error: { code: 'unknown', message: 'Selected group no longer exists' }
      }
    }

    const parsed = config.parse(content)
    const { proxies, result } = applyProxyListImport(
      parsed,
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
    return { canceled: false, error: serializeListImportError(error, format) }
  }
}

async function exportList(
  format: ProxyListImportFormat,
  request: ProxyListExportRequest
): Promise<ProxyListExportResponse> {
  const config = LIST_FORMAT_CONFIG[format]
  const window = getActiveWindow()
  const dialogOptions = {
    title: config.saveTitle,
    defaultPath: formatListExportFileName(format),
    filters: [{ name: config.openFilterName, extensions: config.saveExtensions }]
  }
  const dialogResult = window
    ? await dialog.showSaveDialog(window, dialogOptions)
    : await dialog.showSaveDialog(dialogOptions)

  if (dialogResult.canceled || !dialogResult.filePath) {
    return { canceled: true }
  }

  const proxies = await getProxies()
  const exportProxies = resolveExportProxies(proxies, request.proxyIds)
  const content = config.format(exportProxies)

  await writeFile(dialogResult.filePath, content, 'utf-8')
  return { canceled: false, filePath: dialogResult.filePath }
}

export function registerProxyImportIpc(): void {
  const formats: ProxyListImportFormat[] = ['csv', 'json', 'txt']

  for (const format of formats) {
    ipcMain.handle(`${format}:preview`, async (): Promise<ProxyListImportPreviewResponse> =>
      previewListImport(format)
    )

    ipcMain.handle(
      `${format}:import`,
      async (_event, request: ProxyListImportRequest): Promise<ProxyListImportResponse> =>
        importList(format, request)
    )

    ipcMain.handle(
      `${format}:export`,
      async (_event, request: ProxyListExportRequest): Promise<ProxyListExportResponse> =>
        exportList(format, request)
    )
  }
}
