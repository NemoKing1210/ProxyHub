import type { ProxyGroup } from './proxy-group'
import type { Proxy } from './proxy'
import type { SyncableAppSettings } from './settings'

export const BACKUP_FORMAT_ID = 'proxychecker-backup' as const

export const BACKUP_SCHEMA_VERSION = 1 as const

export const BACKUP_ENCRYPTED_SCHEMA_VERSION = 2 as const

export interface BackupEncryptionMeta {
  algorithm: 'AES-256-GCM'
  kdf: 'PBKDF2-SHA256'
  iterations: number
  salt: string
  iv: string
  tag: string
}

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
  settings?: SyncableAppSettings
}

export interface BackupFileV1 {
  format: typeof BACKUP_FORMAT_ID
  version: typeof BACKUP_SCHEMA_VERSION
  exportedAt: string
  appVersion: string
  payload: BackupPayloadV1
}

export interface BackupFileV2Encrypted {
  format: typeof BACKUP_FORMAT_ID
  version: typeof BACKUP_ENCRYPTED_SCHEMA_VERSION
  exportedAt: string
  appVersion: string
  payloadKind: BackupPayloadKind
  encryption: BackupEncryptionMeta
  payload: string
}

export type BackupFile = BackupFileV1 | BackupFileV2Encrypted

export type BackupParseErrorCode =
  | 'invalid_json'
  | 'invalid_format'
  | 'unsupported_version'
  | 'invalid_payload'
  | 'password_required'
  | 'wrong_password'

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
  encrypted: boolean
  decrypted: boolean
  kind: BackupPayloadKind
  proxyCount: number
  groupCount: number
  favoriteCount: number
  enabledProxyCount: number
  hasSettings: boolean
  checkDomainCount: number
  autoCheckEnabled: boolean
  backupProxies: BackupProxyRecord[]
  backupGroups: BackupGroupRecord[]
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

export interface BackupExportRequest {
  kind: BackupExportKind
  proxyIds?: string[]
  password?: string
}

export interface BackupImportRequest {
  filePath: string
  mode: BackupImportMode
  proxyIds?: string[]
  password?: string
}

export interface BackupUnlockPreviewRequest {
  filePath: string
  password: string
}
