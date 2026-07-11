import {
  SYNC_INTERVAL_DEFAULT,
  SYNC_INTERVAL_MAX,
  SYNC_INTERVAL_MIN
} from '../constants/sync'
import type { BackupImportMode } from '../types/backup'
import type { SyncConfig, SyncProviderType, SyncScope, SyncStatus } from '../types/sync'
import { SYNC_PROVIDER_TYPES, SYNC_SCOPES } from '../types/sync'
import { normalizeDriveRemoteId, normalizeGistRemoteId } from './sync-remote-id'
import { normalizeSyncLastError } from './sync-status'

export const DEFAULT_SYNC_CONFIG: SyncConfig = {
  provider: 'none',
  scope: 'full',
  pullMode: 'merge',
  autoSyncEnabled: false,
  autoSyncIntervalMinutes: SYNC_INTERVAL_DEFAULT,
  syncOnStartup: false,
  pushOnChange: false,
  encryptPayload: false
}

export const DEFAULT_SYNC_STATUS: SyncStatus = {}

function clampInterval(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value)

  if (!Number.isFinite(parsed)) {
    return SYNC_INTERVAL_DEFAULT
  }

  return Math.min(SYNC_INTERVAL_MAX, Math.max(SYNC_INTERVAL_MIN, Math.round(parsed)))
}

function normalizeProvider(value: unknown): SyncProviderType {
  if (typeof value === 'string' && SYNC_PROVIDER_TYPES.includes(value as SyncProviderType)) {
    return value as SyncProviderType
  }

  return 'none'
}

function normalizeScope(value: unknown): SyncScope {
  if (typeof value === 'string' && SYNC_SCOPES.includes(value as SyncScope)) {
    return value as SyncScope
  }

  return 'full'
}

function normalizePullMode(value: unknown): BackupImportMode {
  return value === 'replace' ? 'replace' : 'merge'
}

function normalizeRemoteId(provider: SyncProviderType, source: Partial<SyncConfig>): string | undefined {
  const legacyGistId = source.gistId
  const remoteId = source.remoteId ?? legacyGistId

  if (provider === 'github-gist') {
    return normalizeGistRemoteId(remoteId)
  }

  if (provider === 'google-drive') {
    return normalizeDriveRemoteId(remoteId)
  }

  return undefined
}

function normalizeIsoDate(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) {
    return undefined
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

export function normalizeSyncConfig(input?: Partial<SyncConfig> | null): SyncConfig {
  const source = input ?? {}

  const provider = normalizeProvider(source.provider)
  const remoteId = normalizeRemoteId(provider, source)

  return {
    provider,
    scope: normalizeScope(source.scope),
    pullMode: normalizePullMode(source.pullMode),
    autoSyncEnabled: provider !== 'none' && source.autoSyncEnabled === true,
    autoSyncIntervalMinutes: clampInterval(source.autoSyncIntervalMinutes),
    syncOnStartup: provider !== 'none' && source.syncOnStartup === true,
    pushOnChange: provider !== 'none' && source.pushOnChange === true,
    encryptPayload: provider !== 'none' && source.encryptPayload === true,
    remoteId,
    gistId: provider === 'github-gist' ? remoteId : undefined
  }
}

export function normalizeSyncStatus(input?: Partial<SyncStatus> | null): SyncStatus {
  const source = input ?? {}

  return {
    lastPushAt: normalizeIsoDate(source.lastPushAt),
    lastPullAt: normalizeIsoDate(source.lastPullAt),
    remoteUpdatedAt: normalizeIsoDate(source.remoteUpdatedAt),
    lastError: normalizeSyncLastError(source.lastError)
  }
}

export function isSyncEnabled(config: SyncConfig): boolean {
  return config.provider !== 'none'
}

export function resolveSyncRemoteId(config: SyncConfig): string | undefined {
  return config.remoteId ?? config.gistId
}
