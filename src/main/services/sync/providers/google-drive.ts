import {
  GOOGLE_DRIVE_API_BASE,
  GOOGLE_DRIVE_SYNC_FILENAME,
  GOOGLE_DRIVE_UPLOAD_BASE
} from '@shared/constants/sync-google-drive'
import type { SyncConfig } from '@shared/types/sync'
import { isValidDriveRemoteId } from '@shared/utils/sync-remote-id'
import { resolveSyncRemoteId } from '@shared/utils/sync-config'
import type { SyncSecrets } from '../../sync-secrets'
import { resolveGoogleAccessToken } from '../google-oauth'
import { SyncProviderError } from './sync-errors'
import type { SyncProvider, SyncProviderEnsureResult } from './types'

const USER_AGENT = 'ProxyHub-Sync'

interface DriveFileListResponse {
  files?: Array<{
    id: string
    name?: string
    modifiedTime?: string
  }>
}

interface DriveFileResponse {
  id: string
  modifiedTime?: string
}

interface GoogleErrorResponse {
  error?: {
    message?: string
    code?: number
    status?: string
  }
}

function parseGoogleErrorBody(body: string): string | undefined {
  try {
    const parsed = JSON.parse(body) as GoogleErrorResponse
    return parsed.error?.message
  } catch {
    return undefined
  }
}

function mapHttpError(status: number, body: string): SyncProviderError {
  const details = parseGoogleErrorBody(body)
  const suffix = details ? `: ${details}` : ''

  if (status === 401 || status === 403) {
    return new SyncProviderError('invalid_token', 'Invalid or unauthorized Google account')
  }

  if (status === 404) {
    return new SyncProviderError('remote_not_found', 'Sync file not found in Google Drive')
  }

  if (status === 429) {
    return new SyncProviderError('rate_limited', 'Google Drive API rate limit exceeded')
  }

  if (status === 413) {
    return new SyncProviderError('payload_too_large', 'Sync payload is too large for Google Drive')
  }

  return new SyncProviderError('network_error', `Google Drive API error (${status})${suffix}`)
}

async function driveRequest(
  accessToken: string,
  url: string,
  init?: RequestInit
): Promise<Response> {
  try {
    return await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': USER_AGENT,
        ...(init?.headers ?? {})
      }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network request failed'
    throw new SyncProviderError('network_error', message)
  }
}

function requireSyncContent(content: string): string {
  if (!content.trim()) {
    throw new SyncProviderError('invalid_request', 'Sync payload is empty')
  }

  return content
}

async function requireAccessToken(secrets: SyncSecrets): Promise<string> {
  return resolveGoogleAccessToken(secrets)
}

function escapeDriveQueryValue(value: string): string {
  return value.replace(/'/g, "\\'")
}

async function findSyncFile(accessToken: string): Promise<DriveFileResponse | undefined> {
  const query = `name='${escapeDriveQueryValue(GOOGLE_DRIVE_SYNC_FILENAME)}' and trashed=false`
  const url = `${GOOGLE_DRIVE_API_BASE}/files?spaces=appDataFolder&fields=files(id,name,modifiedTime)&pageSize=1&q=${encodeURIComponent(query)}`

  const response = await driveRequest(accessToken, url)

  if (!response.ok) {
    const body = await response.text()
    throw mapHttpError(response.status, body)
  }

  const parsed = (await response.json()) as DriveFileListResponse
  const file = parsed.files?.[0]

  if (!file?.id) {
    return undefined
  }

  return {
    id: file.id,
    modifiedTime: file.modifiedTime
  }
}

async function resolveRemoteFile(
  config: SyncConfig,
  secrets: SyncSecrets,
  remoteId?: string
): Promise<DriveFileResponse> {
  const accessToken = await requireAccessToken(secrets)
  const configuredRemoteId = remoteId ?? resolveSyncRemoteId(config)

  if (configuredRemoteId && isValidDriveRemoteId(configuredRemoteId)) {
    const response = await driveRequest(
      accessToken,
      `${GOOGLE_DRIVE_API_BASE}/files/${configuredRemoteId}?fields=id,modifiedTime`
    )

    if (response.ok) {
      return (await response.json()) as DriveFileResponse
    }

    if (response.status !== 404) {
      const body = await response.text()
      throw mapHttpError(response.status, body)
    }
  }

  const discovered = await findSyncFile(accessToken)

  if (!discovered) {
    throw new SyncProviderError('remote_not_found', 'Sync file not found in Google Drive app data')
  }

  return discovered
}

async function createSyncFile(accessToken: string, content: string): Promise<DriveFileResponse> {
  const boundary = `proxyhub-${Date.now()}`
  const metadata = JSON.stringify({
    name: GOOGLE_DRIVE_SYNC_FILENAME,
    parents: ['appDataFolder']
  })

  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    metadata,
    `--${boundary}`,
    'Content-Type: application/json',
    '',
    requireSyncContent(content),
    `--${boundary}--`,
    ''
  ].join('\r\n')

  const response = await driveRequest(
    accessToken,
    `${GOOGLE_DRIVE_UPLOAD_BASE}/files?uploadType=multipart&fields=id,modifiedTime`,
    {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body
    }
  )

  if (!response.ok) {
    const errorBody = await response.text()
    throw mapHttpError(response.status, errorBody)
  }

  return (await response.json()) as DriveFileResponse
}

async function updateSyncFile(
  accessToken: string,
  fileId: string,
  content: string
): Promise<DriveFileResponse> {
  const response = await driveRequest(
    accessToken,
    `${GOOGLE_DRIVE_UPLOAD_BASE}/files/${fileId}?uploadType=media&fields=id,modifiedTime`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: requireSyncContent(content)
    }
  )

  if (!response.ok) {
    const errorBody = await response.text()
    throw mapHttpError(response.status, errorBody)
  }

  return (await response.json()) as DriveFileResponse
}

async function downloadSyncFile(accessToken: string, fileId: string): Promise<string> {
  const response = await driveRequest(
    accessToken,
    `${GOOGLE_DRIVE_API_BASE}/files/${fileId}?alt=media`
  )

  if (!response.ok) {
    const body = await response.text()
    throw mapHttpError(response.status, body)
  }

  const content = await response.text()

  if (!content.trim()) {
    throw new SyncProviderError('remote_file_missing', 'Sync file is empty in Google Drive')
  }

  return content
}

export const googleDriveProvider: SyncProvider = {
  async testConnection(config, secrets) {
    await resolveRemoteFile(config, secrets)
  },

  async ensureRemote(config, secrets, initialContent): Promise<SyncProviderEnsureResult> {
    const accessToken = await requireAccessToken(secrets)
    const content = requireSyncContent(initialContent)
    const configuredRemoteId = resolveSyncRemoteId(config)

    if (configuredRemoteId && isValidDriveRemoteId(configuredRemoteId)) {
      try {
        const existing = await resolveRemoteFile(config, secrets, configuredRemoteId)
        return { remoteId: existing.id, gistId: existing.id }
      } catch (error) {
        if (!(error instanceof SyncProviderError) || error.code !== 'remote_not_found') {
          throw error
        }
      }
    }

    const discovered = await findSyncFile(accessToken)

    if (discovered) {
      return { remoteId: discovered.id, gistId: discovered.id }
    }

    const created = await createSyncFile(accessToken, content)

    return {
      remoteId: created.id,
      gistId: created.id,
      updatedAt: created.modifiedTime ?? new Date().toISOString(),
      created: true
    }
  },

  async push(content, _config, secrets, remoteId) {
    const accessToken = await requireAccessToken(secrets)
    const updated = await updateSyncFile(accessToken, remoteId, content)

    return {
      updatedAt: updated.modifiedTime ?? new Date().toISOString()
    }
  },

  async pull(config, secrets, remoteId) {
    const file = await resolveRemoteFile(config, secrets, remoteId)
    const accessToken = await requireAccessToken(secrets)
    const content = await downloadSyncFile(accessToken, file.id)

    return {
      content,
      updatedAt: file.modifiedTime ?? new Date().toISOString(),
      remoteId: file.id
    }
  }
}
