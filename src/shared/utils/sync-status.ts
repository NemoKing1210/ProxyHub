import type { SyncConfig, SyncErrorCode, SyncLastErrorInfo, SyncStatus } from '../types/sync'

export interface SyncStatusErrorContext {
  config: SyncConfig
  status: SyncStatus
  hasCredentials: boolean
  /** @deprecated use hasCredentials */
  hasToken?: boolean
  hasPayloadPassword: boolean
  safeStorageAvailable: boolean
  googleEmail?: string
}

const SYNC_ERROR_CODES: SyncErrorCode[] = [
  'invalid_json',
  'invalid_format',
  'unsupported_version',
  'invalid_payload',
  'password_required',
  'wrong_password',
  'sync_disabled',
  'token_required',
  'auth_required',
  'auth_cancelled',
  'safe_storage_unavailable',
  'invalid_token',
  'gist_not_found',
  'gist_file_missing',
  'remote_not_found',
  'remote_file_missing',
  'rate_limited',
  'payload_too_large',
  'network_error',
  'invalid_request',
  'google_oauth_not_configured',
  'unknown'
]

const SYNC_ERROR_CODE_SET = new Set<string>(SYNC_ERROR_CODES)

function normalizeErrorCode(value: unknown): SyncErrorCode {
  if (typeof value === 'string' && SYNC_ERROR_CODE_SET.has(value)) {
    return value as SyncErrorCode
  }

  return 'unknown'
}

function normalizeErrorOperation(value: unknown): SyncLastErrorInfo['operation'] | undefined {
  if (
    value === 'push' ||
    value === 'pull' ||
    value === 'pull-preview' ||
    value === 'pull-apply' ||
    value === 'startup-pull' ||
    value === 'test'
  ) {
    return value
  }

  return undefined
}

export function normalizeSyncLastError(value: unknown): SyncLastErrorInfo | undefined {
  if (typeof value === 'string' && value.trim()) {
    return {
      code: 'unknown',
      message: value.trim(),
      occurredAt: ''
    }
  }

  if (typeof value !== 'object' || value === null) {
    return undefined
  }

  const source = value as Partial<SyncLastErrorInfo>
  const message = typeof source.message === 'string' ? source.message.trim() : ''

  if (!message) {
    return undefined
  }

  const occurredAt =
    typeof source.occurredAt === 'string' && source.occurredAt.trim() ? source.occurredAt : ''

  return {
    code: normalizeErrorCode(source.code),
    message,
    occurredAt,
    operation: normalizeErrorOperation(source.operation)
  }
}

export function resolveLastSyncAt(status: SyncStatus): string | undefined {
  const timestamps = [status.lastPushAt, status.lastPullAt].filter((value): value is string =>
    Boolean(value)
  )

  if (timestamps.length === 0) {
    return undefined
  }

  return timestamps.sort((left, right) => Date.parse(right) - Date.parse(left))[0]
}

function formatActivityTimestamp(value?: string): string {
  return value || '—'
}

function resolveRemoteIdLabel(config: SyncConfig): string {
  return config.remoteId ?? config.gistId ?? 'not set'
}

export function buildSyncStatusErrorReport(
  error: SyncLastErrorInfo,
  context: SyncStatusErrorContext
): string {
  const { config, status, hasCredentials, hasPayloadPassword, safeStorageAvailable, googleEmail } =
    context

  const lines = [
    '=== ProxyChecker Sync Error ===',
    `Time: ${error.occurredAt || 'unknown'}`,
    `Operation: ${error.operation || 'unknown'}`,
    `Code: ${error.code}`,
    `Message: ${error.message}`,
    '',
    '--- Context ---',
    `Provider: ${config.provider}`,
    `Scope: ${config.scope}`,
    `Pull mode: ${config.pullMode}`,
    `Remote ID: ${resolveRemoteIdLabel(config)}`,
    `Credentials saved: ${hasCredentials ? 'yes' : 'no'}`,
    ...(config.provider === 'google-drive' && googleEmail
      ? [`Google account: ${googleEmail}`]
      : []),
    `Payload password saved: ${hasPayloadPassword ? 'yes' : 'no'}`,
    `Encryption enabled: ${config.encryptPayload ? 'yes' : 'no'}`,
    `Auto sync: ${config.autoSyncEnabled ? `enabled (${config.autoSyncIntervalMinutes} min)` : 'disabled'}`,
    `Sync on startup: ${config.syncOnStartup ? 'yes' : 'no'}`,
    `Push on change: ${config.pushOnChange ? 'yes' : 'no'}`,
    `Safe storage: ${safeStorageAvailable ? 'available' : 'unavailable'}`,
    '',
    '--- Recent activity ---',
    `Last push: ${formatActivityTimestamp(status.lastPushAt)}`,
    `Last pull: ${formatActivityTimestamp(status.lastPullAt)}`,
    `Remote updated: ${formatActivityTimestamp(status.remoteUpdatedAt)}`
  ]

  return `${lines.join('\n')}\n`
}
