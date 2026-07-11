import type { SyncConfig } from '../../../../shared/types/sync'
import type { SyncSecrets } from '../../sync-secrets'

export interface SyncProviderPullResult {
  content: string
  updatedAt: string
  remoteId?: string
}

export interface SyncProviderEnsureResult {
  remoteId: string
  /** @deprecated use remoteId */
  gistId?: string
  updatedAt?: string
  created?: boolean
}

export interface SyncProvider {
  testConnection(config: SyncConfig, secrets: SyncSecrets): Promise<void>
  ensureRemote(
    config: SyncConfig,
    secrets: SyncSecrets,
    initialContent: string
  ): Promise<SyncProviderEnsureResult>
  push(
    content: string,
    config: SyncConfig,
    secrets: SyncSecrets,
    remoteId: string
  ): Promise<{ updatedAt: string }>
  pull(
    config: SyncConfig,
    secrets: SyncSecrets,
    remoteId?: string
  ): Promise<SyncProviderPullResult>
}
