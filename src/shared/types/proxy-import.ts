import type { ProxyAnonymityLevel, ProxyProtocol } from './proxy'

export type ProxyImportFormat = 'backup' | 'csv'

export interface CsvImportPreviewEntry {
  id: string
  host: string
  port: number
  protocol: ProxyProtocol
  anonymityLevel?: ProxyAnonymityLevel
  countryCode?: string
  city?: string
  isDuplicate: boolean
}

export interface CsvImportPreview {
  filePath: string
  fileName: string
  entries: CsvImportPreviewEntry[]
  invalidLineCount: number
  totalLineCount: number
}

export type CsvImportErrorCode = 'empty_file' | 'no_valid_entries' | 'read_error' | 'unknown'

export interface CsvImportError {
  code: CsvImportErrorCode
  message: string
}

export type CsvImportPreviewResponse =
  | { canceled: true }
  | { canceled: false; preview: CsvImportPreview }
  | { canceled: false; error: CsvImportError }

export interface CsvImportRequest {
  filePath: string
  entryIds: string[]
  groupId?: string
}

export interface CsvImportResult {
  added: number
  skippedDuplicates: number
}

export type CsvImportResponse =
  | { canceled: false; result: CsvImportResult }
  | { canceled: false; error: CsvImportError }

export interface CsvExportRequest {
  proxyIds: string[]
}

export type CsvExportResponse = { canceled: true } | { canceled: false; filePath: string }
