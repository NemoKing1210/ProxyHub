import { randomUUID } from 'crypto'
import type { BackupFileV1, BackupPreview } from '../../../shared/types/backup'
import type {
  SyncError,
  SyncPublicState,
  SyncPullApplyRequest,
  SyncPullApplyResult,
  SyncPullPreviewResult,
  SyncPushResult,
  SyncSaveConfigRequest,
  SyncStartupPullResult,
  SyncStatus,
  SyncLastErrorInfo,
  SyncTestResult
} from '../../../shared/types/sync'
import { isSyncEnabled } from '../../../shared/utils/sync-config'
import { isValidGistId } from '../../../shared/utils/sync-gist'
import {
  applyBackupImport,
  buildBackupPreview,
  buildLockedBackupPreview,
  isEncryptedBackupFile,
  parseBackupEnvelopeFromContent
} from '../../../shared/utils/backup'
import { BackupParseError } from '../../../shared/utils/backup'
import {
  getGroups,
  getProxies,
  getSettings,
  getSyncConfig,
  getSyncStatus,
  saveGroups,
  saveProxies,
  saveSettings,
  saveSyncConfig,
  saveSyncStatus
} from '../app-store'
import { createBackupContent, loadBackupFile, readAppVersion } from '../backup-content'
import { refreshTrayContextMenu } from '../tray'
import { notifyTrayDataChanged } from '../tray-actions'
import { syncTrayEnabled } from '../../ipc/tray'
import { getSyncProvider } from './provider-registry'
import { toSyncError } from './providers/github-gist'
import {
  getSyncSecrets,
  hasGithubToken,
  hasPayloadPassword,
  isSafeStorageAvailable,
  requireGithubToken,
  resolvePayloadPassword,
  saveSyncSecrets
} from '../sync-secrets'

interface PullSession {
  content: string
  preview: BackupPreview
}

const pullSessions = new Map<string, PullSession>()

const PULL_SESSION_TTL_MS = 15 * 60 * 1000

function cleanupPullSessions(): void {
  // Sessions are simple in-memory; TTL handled on access only.
}

function storePullSession(session: PullSession): string {
  cleanupPullSessions()
  const sessionId = randomUUID()
  pullSessions.set(sessionId, session)

  setTimeout(() => {
    pullSessions.delete(sessionId)
  }, PULL_SESSION_TTL_MS)

  return sessionId
}

function getPullSession(sessionId: string): PullSession | undefined {
  return pullSessions.get(sessionId)
}

function deletePullSession(sessionId: string): void {
  pullSessions.delete(sessionId)
}

async function persistImportedSettings(previousTrayEnabled: boolean, previousLanguage: string): Promise<void> {
  const settings = await getSettings()

  if (previousTrayEnabled !== settings.trayEnabled) {
    await syncTrayEnabled(settings.trayEnabled)
    return
  }

  if (settings.trayEnabled && previousLanguage !== settings.language) {
    await refreshTrayContextMenu()
  }
}

function serializeBackupError(error: unknown): SyncError {
  if (error instanceof BackupParseError) {
    return { code: error.code, message: error.message }
  }

  return toSyncError(error)
}

const SYNC_GIST_DISPLAY_NAME = 'proxychecker-sync.pcbackup.json'

function buildRemotePreview(content: string, backup: BackupFileV1, envelopeEncrypted: boolean): BackupPreview {
  const remoteLabel = 'remote-sync'

  if (envelopeEncrypted) {
    const envelope = parseBackupEnvelopeFromContent(content)
    if (isEncryptedBackupFile(envelope)) {
      return buildLockedBackupPreview(envelope, remoteLabel, SYNC_GIST_DISPLAY_NAME)
    }
  }

  return buildBackupPreview(backup, remoteLabel, SYNC_GIST_DISPLAY_NAME)
}

async function resolveSecretsWithToken(overrideToken?: string) {
  const secrets = await getSyncSecrets()

  if (overrideToken?.trim()) {
    return { ...secrets, githubToken: overrideToken.trim() }
  }

  const token = await requireGithubToken()
  return { ...secrets, githubToken: token }
}

export async function getSyncPublicState(): Promise<SyncPublicState> {
  const [config, status, hasToken, hasPassword] = await Promise.all([
    getSyncConfig(),
    getSyncStatus(),
    hasGithubToken(),
    hasPayloadPassword()
  ])

  return {
    config,
    status,
    hasToken,
    hasPayloadPassword: hasPassword,
    safeStorageAvailable: isSafeStorageAvailable()
  }
}

export async function saveSyncConfiguration(request: SyncSaveConfigRequest): Promise<SyncPublicState> {
  const normalized = request.config

  if (
    (request.githubToken !== undefined ||
      request.payloadPassword !== undefined ||
      request.clearGithubToken ||
      request.clearPayloadPassword) &&
    !isSafeStorageAvailable()
  ) {
    throw new Error('Safe storage is not available')
  }

  if (
    request.githubToken !== undefined ||
    request.payloadPassword !== undefined ||
    request.clearGithubToken ||
    request.clearPayloadPassword
  ) {
    await saveSyncSecrets({
      githubToken: request.githubToken,
      payloadPassword: request.payloadPassword,
      clearGithubToken: request.clearGithubToken,
      clearPayloadPassword: request.clearPayloadPassword
    })
  }

  await saveSyncConfig(normalized)

  if (!isSyncEnabled(normalized)) {
    await saveSyncStatus({})
  }

  return getSyncPublicState()
}

export async function testSyncConnection(githubToken?: string): Promise<SyncTestResult> {
  try {
    const config = await getSyncConfig()

    if (!isSyncEnabled(config)) {
      return {
        ok: false,
        error: { code: 'sync_disabled', message: 'Sync is disabled' }
      }
    }

    const provider = getSyncProvider(config.provider)

    if (!provider) {
      return {
        ok: false,
        error: { code: 'unknown', message: 'Sync provider is not available' }
      }
    }

    const secrets = await resolveSecretsWithToken(githubToken)
    await provider.testConnection(config, secrets)

    return {
      ok: true,
      gistId: config.gistId
    }
  } catch (error) {
    return { ok: false, error: toSyncError(error) }
  }
}

async function updateSyncStatus(patch: Partial<SyncStatus>): Promise<void> {
  const current = await getSyncStatus()
  await saveSyncStatus({
    ...current,
    ...patch,
    lastError: patch.lastError === undefined ? current.lastError : patch.lastError
  })
}

async function recordSyncError(
  error: SyncError,
  operation: SyncLastErrorInfo['operation']
): Promise<void> {
  await updateSyncStatus({
    lastError: {
      code: error.code,
      message: error.message,
      occurredAt: new Date().toISOString(),
      operation
    }
  })
}

async function failPush(error: SyncError): Promise<SyncPushResult> {
  await recordSyncError(error, 'push')
  return { ok: false, error }
}

async function failPullPreview(error: SyncError): Promise<SyncPullPreviewResult> {
  await recordSyncError(error, 'pull-preview')
  return { ok: false, error }
}

export async function pushSync(): Promise<SyncPushResult> {
  try {
    let config = await getSyncConfig()

    if (!isSyncEnabled(config)) {
      return failPush({ code: 'sync_disabled', message: 'Sync is disabled' })
    }

    const provider = getSyncProvider(config.provider)

    if (!provider) {
      return failPush({ code: 'unknown', message: 'Sync provider is not available' })
    }

    const secrets = await getSyncSecrets()

    if (!secrets.githubToken?.trim()) {
      return failPush({ code: 'token_required', message: 'GitHub token is required' })
    }

    if (config.encryptPayload && !secrets.payloadPassword) {
      return failPush({
        code: 'password_required',
        message: 'Payload password is required'
      })
    }

    const [proxies, groups, settings, appVersion] = await Promise.all([
      getProxies(),
      getGroups(),
      getSettings(),
      readAppVersion()
    ])

    const content = createBackupContent({
      kind: config.scope,
      proxies,
      groups,
      settings,
      appVersion,
      password: config.encryptPayload ? secrets.payloadPassword : undefined
    })

    const ensured = await provider.ensureRemote(config, secrets, content)
    const gistId = ensured.gistId

    if (gistId !== config.gistId) {
      config = { ...config, gistId }
      await saveSyncConfig(config)
    }

    const pushed = ensured.created
      ? { updatedAt: ensured.updatedAt ?? new Date().toISOString() }
      : await provider.push(content, config, secrets, gistId)
    const pushedAt = new Date().toISOString()

    await updateSyncStatus({
      lastPushAt: pushedAt,
      remoteUpdatedAt: pushed.updatedAt,
      lastError: undefined
    })

    return { ok: true, gistId, pushedAt }
  } catch (error) {
    const syncError = toSyncError(error)
    await recordSyncError(syncError, 'push')
    return { ok: false, error: syncError }
  }
}

export async function pullSyncPreview(password?: string): Promise<SyncPullPreviewResult> {
  try {
    const config = await getSyncConfig()

    if (!isSyncEnabled(config)) {
      return failPullPreview({ code: 'sync_disabled', message: 'Sync is disabled' })
    }

    const provider = getSyncProvider(config.provider)

    if (!provider) {
      return failPullPreview({ code: 'unknown', message: 'Sync provider is not available' })
    }

    const secrets = await getSyncSecrets()

    if (!secrets.githubToken?.trim()) {
      return failPullPreview({ code: 'token_required', message: 'GitHub token is required' })
    }

    if (!config.gistId) {
      return failPullPreview({ code: 'gist_not_found', message: 'Gist ID is not configured' })
    }

    if (!isValidGistId(config.gistId)) {
      return failPullPreview({ code: 'gist_not_found', message: 'Gist ID is invalid' })
    }

    const pulled = await provider.pull(config, secrets, config.gistId)
    const envelope = parseBackupEnvelopeFromContent(pulled.content)
    const encrypted = isEncryptedBackupFile(envelope)
    const resolvedPassword = await resolvePayloadPassword(password, config.encryptPayload)

    if (encrypted && !resolvedPassword && !password) {
      const preview = buildRemotePreview(pulled.content, envelope as unknown as BackupFileV1, true)
      const sessionId = storePullSession({
        content: pulled.content,
        preview
      })

      return { ok: true, preview, sessionId }
    }

    const backup = loadBackupFile(pulled.content, resolvedPassword ?? password)
    const preview = buildRemotePreview(pulled.content, backup, encrypted)
    const sessionId = storePullSession({ content: pulled.content, preview })

    await updateSyncStatus({
      remoteUpdatedAt: pulled.updatedAt,
      lastError: undefined
    })

    return { ok: true, preview, sessionId }
  } catch (error) {
    const syncError = serializeBackupError(error)
    await recordSyncError(syncError, 'pull-preview')
    return { ok: false, error: syncError }
  }
}

export async function unlockSyncPullPreview(
  sessionId: string,
  password: string
): Promise<SyncPullPreviewResult> {
  try {
    const session = getPullSession(sessionId)

    if (!session) {
      return { ok: false, error: { code: 'unknown', message: 'Pull session expired' } }
    }

    const backup = loadBackupFile(session.content, password)
    const preview = buildBackupPreview(backup, 'remote-sync', SYNC_GIST_DISPLAY_NAME, {
      encrypted: true,
      decrypted: true,
      envelopeKind: backup.payload.kind,
      schemaVersion: backup.version
    })

    pullSessions.set(sessionId, { ...session, preview })

    return { ok: true, preview, sessionId }
  } catch (error) {
    return { ok: false, error: serializeBackupError(error) }
  }
}

export async function applySyncPull(request: SyncPullApplyRequest): Promise<SyncPullApplyResult> {
  try {
    const session = getPullSession(request.sessionId)

    if (!session) {
      return { ok: false, error: { code: 'unknown', message: 'Pull session expired' } }
    }

    const config = await getSyncConfig()
    const password = await resolvePayloadPassword(request.password, config.encryptPayload)
    const backup = loadBackupFile(session.content, password ?? request.password)

    const [proxies, groups, settings] = await Promise.all([
      getProxies(),
      getGroups(),
      getSettings()
    ])

    const previousTrayEnabled = settings.trayEnabled
    const previousLanguage = settings.language
    const { data, result } = applyBackupImport(
      backup,
      { proxies, groups, settings },
      request.mode,
      request.proxyIds
    )

    const includesProxies = result.kind === 'full' || result.kind === 'proxies'
    const includesSettings = result.kind === 'full' || result.kind === 'settings'

    if (includesProxies) {
      await saveGroups(data.groups)
      await saveProxies(data.proxies)
      notifyTrayDataChanged()
    }

    if (includesSettings) {
      await saveSettings(data.settings)
      await persistImportedSettings(previousTrayEnabled, previousLanguage)
    }

    await updateSyncStatus({
      lastPullAt: new Date().toISOString(),
      lastError: undefined
    })

    deletePullSession(request.sessionId)

    return { ok: true, result }
  } catch (error) {
    const syncError = serializeBackupError(error)
    await recordSyncError(syncError, 'pull-apply')
    return { ok: false, error: syncError }
  }
}

export async function startupSyncPull(): Promise<SyncStartupPullResult> {
  try {
    const config = await getSyncConfig()

    if (!isSyncEnabled(config) || !config.syncOnStartup) {
      return { ok: true, skipped: true }
    }

    if (!config.gistId) {
      return { ok: true, skipped: true }
    }

    const provider = getSyncProvider(config.provider)

    if (!provider) {
      return { ok: false, error: { code: 'unknown', message: 'Sync provider is not available' } }
    }

    const secrets = await getSyncSecrets()

    if (!secrets.githubToken?.trim()) {
      return { ok: true, skipped: true }
    }

    const pulled = await provider.pull(config, secrets, config.gistId)
    const password = await resolvePayloadPassword(undefined, config.encryptPayload)
    const backup = loadBackupFile(pulled.content, password)

    const [proxies, groups, settings] = await Promise.all([
      getProxies(),
      getGroups(),
      getSettings()
    ])

    const previousTrayEnabled = settings.trayEnabled
    const previousLanguage = settings.language
    const { data, result } = applyBackupImport(
      backup,
      { proxies, groups, settings },
      config.pullMode
    )

    const includesProxies = result.kind === 'full' || result.kind === 'proxies'
    const includesSettings = result.kind === 'full' || result.kind === 'settings'

    if (includesProxies) {
      await saveGroups(data.groups)
      await saveProxies(data.proxies)
      notifyTrayDataChanged()
    }

    if (includesSettings) {
      await saveSettings(data.settings)
      await persistImportedSettings(previousTrayEnabled, previousLanguage)
    }

    await updateSyncStatus({
      lastPullAt: new Date().toISOString(),
      remoteUpdatedAt: pulled.updatedAt,
      lastError: undefined
    })

    return { ok: true, result }
  } catch (error) {
    const syncError = serializeBackupError(error)
    await recordSyncError(syncError, 'startup-pull')
    return { ok: false, error: syncError }
  }
}
