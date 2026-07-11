import type {
  BackupImportMode,
  BackupImportResult,
  BackupParseErrorCode,
  BackupPreview
} from './backup'
import type { BackupPayloadKind } from './backup'

export type SyncProviderType = 'none' | 'github-gist' | 'google-drive'

export type SyncScope = BackupPayloadKind

export interface SyncConfig {
  provider: SyncProviderType
  scope: SyncScope
  pullMode: BackupImportMode
  autoSyncEnabled: boolean
  autoSyncIntervalMinutes: number
  syncOnStartup: boolean
  pushOnChange: boolean
  encryptPayload: boolean
  /** @deprecated use remoteId */
  gistId?: string
  remoteId?: string
}

export interface SyncLastErrorInfo {
  code: SyncErrorCode
  message: string
  occurredAt: string
  operation?: 'push' | 'pull' | 'pull-preview' | 'pull-apply' | 'startup-pull' | 'test'
}

export interface SyncStatus {
  lastPushAt?: string
  lastPullAt?: string
  remoteUpdatedAt?: string
  lastError?: SyncLastErrorInfo
}

export interface SyncPublicState {
  config: SyncConfig
  status: SyncStatus
  hasCredentials: boolean
  /** @deprecated use hasCredentials */
  hasToken: boolean
  hasPayloadPassword: boolean
  safeStorageAvailable: boolean
  googleEmail?: string
  hasGoogleClientId: boolean
}

export type SyncErrorCode =
  | BackupParseErrorCode
  | 'sync_disabled'
  | 'token_required'
  | 'auth_required'
  | 'auth_cancelled'
  | 'password_required'
  | 'safe_storage_unavailable'
  | 'invalid_token'
  | 'gist_not_found'
  | 'gist_file_missing'
  | 'remote_not_found'
  | 'remote_file_missing'
  | 'rate_limited'
  | 'payload_too_large'
  | 'network_error'
  | 'invalid_request'
  | 'google_oauth_not_configured'
  | 'unknown'

export interface SyncError {
  code: SyncErrorCode
  message: string
}

export interface SyncSaveConfigRequest {
  config: SyncConfig
  githubToken?: string
  payloadPassword?: string
  clearGithubToken?: boolean
  clearGoogleAuth?: boolean
  clearPayloadPassword?: boolean
}

export interface SyncTestResult {
  ok: boolean
  remoteId?: string
  /** @deprecated use remoteId */
  gistId?: string
  error?: SyncError
}

export interface SyncPushResult {
  ok: boolean
  remoteId?: string
  /** @deprecated use remoteId */
  gistId?: string
  pushedAt?: string
  error?: SyncError
}

export interface SyncPullPreviewSuccess {
  ok: true
  preview: BackupPreview
  sessionId: string
}

export interface SyncPullPreviewFailed {
  ok: false
  error: SyncError
}

export type SyncPullPreviewResult = SyncPullPreviewSuccess | SyncPullPreviewFailed

export interface SyncPullApplyRequest {
  sessionId: string
  mode: BackupImportMode
  proxyIds?: string[]
  password?: string
}

export interface SyncPullApplySuccess {
  ok: true
  result: BackupImportResult
}

export interface SyncPullApplyFailed {
  ok: false
  error: SyncError
}

export type SyncPullApplyResult = SyncPullApplySuccess | SyncPullApplyFailed

export interface SyncStartupPullResult {
  ok: boolean
  skipped?: boolean
  result?: BackupImportResult
  error?: SyncError
}

export interface SyncGoogleConnectResult {
  ok: boolean
  email?: string
  error?: SyncError
}

export interface SyncGoogleDisconnectResult {
  ok: boolean
  error?: SyncError
}

export const SYNC_PROVIDER_TYPES: SyncProviderType[] = ['none', 'github-gist', 'google-drive']

export const SYNC_SCOPES: SyncScope[] = ['full', 'proxies', 'settings']
