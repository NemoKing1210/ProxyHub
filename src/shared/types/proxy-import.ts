import type { ProxyAnonymityLevel, ProxyProtocol } from './proxy'

export type ProxyImportFormat = 'backup' | 'csv' | 'json' | 'txt'

export type ProxyListImportFormat = Exclude<ProxyImportFormat, 'backup'>

export interface ProxyListImportPreviewEntry {
  id: string
  host: string
  port: number
  protocol: ProxyProtocol
  anonymityLevel?: ProxyAnonymityLevel
  countryCode?: string
  city?: string
  isDuplicate: boolean
}

export interface ProxyListImportPreview {
  filePath: string
  fileName: string
  entries: ProxyListImportPreviewEntry[]
  invalidLineCount: number
  totalLineCount: number
}

export type ProxyListImportErrorCode =
  | 'empty_file'
  | 'no_valid_entries'
  | 'read_error'
  | 'invalid_json'
  | 'unknown'

export interface ProxyListImportError {
  code: ProxyListImportErrorCode
  message: string
}

export type ProxyListImportPreviewResponse =
  | { canceled: true }
  | { canceled: false; preview: ProxyListImportPreview }
  | { canceled: false; error: ProxyListImportError }

export interface ProxyListImportRequest {
  filePath: string
  entryIds: string[]
  groupId?: string
}

export interface ProxyListImportResult {
  added: number
  skippedDuplicates: number
}

export type ProxyListImportResponse =
  | { canceled: false; result: ProxyListImportResult }
  | { canceled: false; error: ProxyListImportError }

export interface ProxyListExportRequest {
  proxyIds: string[]
}

export type ProxyListExportResponse = { canceled: true } | { canceled: false; filePath: string }

/** @deprecated Use ProxyListImportPreviewEntry */
export type CsvImportPreviewEntry = ProxyListImportPreviewEntry

/** @deprecated Use ProxyListImportPreview */
export type CsvImportPreview = ProxyListImportPreview

/** @deprecated Use ProxyListImportErrorCode */
export type CsvImportErrorCode = ProxyListImportErrorCode

/** @deprecated Use ProxyListImportError */
export type CsvImportError = ProxyListImportError

/** @deprecated Use ProxyListImportPreviewResponse */
export type CsvImportPreviewResponse = ProxyListImportPreviewResponse

/** @deprecated Use ProxyListImportRequest */
export type CsvImportRequest = ProxyListImportRequest

/** @deprecated Use ProxyListImportResult */
export type CsvImportResult = ProxyListImportResult

/** @deprecated Use ProxyListImportResponse */
export type CsvImportResponse = ProxyListImportResponse

/** @deprecated Use ProxyListExportRequest */
export type CsvExportRequest = ProxyListExportRequest

/** @deprecated Use ProxyListExportResponse */
export type CsvExportResponse = ProxyListExportResponse
