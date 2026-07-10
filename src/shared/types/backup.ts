import type { ProxyGroup } from './proxy-group'
import type { Proxy } from './proxy'
import type { AppSettings } from './settings'

export const BACKUP_FORMAT_ID = 'proxychecker-backup' as const

export const BACKUP_SCHEMA_VERSION = 1 as const

export type BackupExportKind = 'full' | 'proxies' | 'settings'

export type BackupPayloadKind = BackupExportKind

export type BackupImportMode = 'replace' | 'merge'

export interface BackupProxyRecord {
  id: string
  protocol: Proxy['protocol']
  host: string
  port: number
  username?: string
  password?: string
  secret?: string
  label?: string
  icon?: Proxy['icon']
  color?: Proxy['color']
  countryCode?: string
  city?: string
  anonymityLevel?: Proxy['anonymityLevel']
  isFavorite?: boolean
  isEnabled?: boolean
  groupId?: string
  createdAt: string
}

export interface BackupGroupRecord {
  id: string
  name: string
  icon?: ProxyGroup['icon']
  color?: ProxyGroup['color']
  createdAt: string
}

export interface BackupProxiesPayload {
  groups: BackupGroupRecord[]
  items: BackupProxyRecord[]
}

export interface BackupPayloadV1 {
  kind: BackupPayloadKind
  proxies?: BackupProxiesPayload
  settings?: AppSettings
}

export interface BackupFileV1 {
  format: typeof BACKUP_FORMAT_ID
  version: typeof BACKUP_SCHEMA_VERSION
  exportedAt: string
  appVersion: string
  payload: BackupPayloadV1
}

export type BackupParseErrorCode =
  | 'invalid_json'
  | 'invalid_format'
  | 'unsupported_version'
  | 'invalid_payload'

export interface BackupImportResult {
  kind: BackupPayloadKind
  mode: BackupImportMode
  proxiesAdded: number
  proxiesSkipped: number
  groupsAdded: number
  groupsSkipped: number
  settingsImported: boolean
}

export interface BackupExportResult {
  canceled: true
}

export interface BackupExportSuccess {
  canceled: false
  filePath: string
}

export type BackupExportResponse = BackupExportResult | BackupExportSuccess

export interface BackupImportCanceled {
  canceled: true
}

export interface BackupImportSuccess {
  canceled: false
  result: BackupImportResult
}

export interface BackupImportFailed {
  canceled: false
  error: {
    code: BackupParseErrorCode | 'unknown'
    message: string
  }
}

export type BackupImportResponse = BackupImportCanceled | BackupImportSuccess | BackupImportFailed

export interface BackupPreview {
  filePath: string
  fileName: string
  format: string
  schemaVersion: number
  appVersion: string
  exportedAt: string
  kind: BackupPayloadKind
  proxyCount: number
  groupCount: number
  favoriteCount: number
  enabledProxyCount: number
  hasSettings: boolean
  checkDomainCount: number
  autoCheckEnabled: boolean
}

export interface BackupPreviewCanceled {
  canceled: true
}

export interface BackupPreviewSuccess {
  canceled: false
  preview: BackupPreview
}

export interface BackupPreviewFailed {
  canceled: false
  error: {
    code: BackupParseErrorCode | 'unknown'
    message: string
  }
}

export type BackupPreviewResponse =
  | BackupPreviewCanceled
  | BackupPreviewSuccess
  | BackupPreviewFailed

export interface BackupImportRequest {
  filePath: string
  mode: BackupImportMode
}
