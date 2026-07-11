import {
  GITHUB_GIST_API_BASE,
  SYNC_GIST_DESCRIPTION,
  SYNC_GIST_FILENAME
} from '../../../../shared/constants/sync'
import type { SyncError, SyncErrorCode } from '../../../../shared/types/sync'
import { isValidGistId } from '../../../../shared/utils/sync-gist'
import type { SyncSecrets } from '../../sync-secrets'
import type { SyncProvider, SyncProviderEnsureResult } from './types'

const USER_AGENT = 'ProxyChecker-Sync'

interface GistFile {
  content?: string
}

interface GistResponse {
  id: string
  updated_at: string
  files?: Record<string, GistFile | null>
}

interface GithubErrorResponse {
  message?: string
  errors?: Array<{
    field?: string
    code?: string
    message?: string
  }>
}

export class SyncProviderError extends Error {
  readonly code: SyncErrorCode

  constructor(code: SyncErrorCode, message: string) {
    super(message)
    this.name = 'SyncProviderError'
    this.code = code
  }
}

function parseGithubErrorBody(body: string): string | undefined {
  try {
    const parsed = JSON.parse(body) as GithubErrorResponse
    const details = parsed.errors
      ?.map((entry) => entry.message || entry.code)
      .filter(Boolean)
      .join('; ')

    if (parsed.message && details) {
      return `${parsed.message}: ${details}`
    }

    return parsed.message || details
  } catch {
    return undefined
  }
}

function mapHttpError(status: number, body: string): SyncProviderError {
  const details = parseGithubErrorBody(body)
  const suffix = details ? `: ${details}` : ''

  if (status === 401 || status === 403) {
    return new SyncProviderError('invalid_token', 'Invalid or unauthorized GitHub token')
  }

  if (status === 404) {
    return new SyncProviderError('gist_not_found', 'Gist not found')
  }

  if (status === 422) {
    if (body.includes('too large')) {
      return new SyncProviderError('payload_too_large', 'Gist payload is too large')
    }

    return new SyncProviderError(
      'invalid_request',
      `GitHub rejected the sync request${suffix || ' (validation failed)'}`
    )
  }

  if (status === 429) {
    return new SyncProviderError('rate_limited', 'GitHub API rate limit exceeded')
  }

  return new SyncProviderError('network_error', `GitHub API error (${status})${suffix}`)
}

async function githubRequest(
  token: string,
  path: string,
  init?: RequestInit
): Promise<Response> {
  try {
    return await fetch(`${GITHUB_GIST_API_BASE}${path}`, {
      ...init,
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': USER_AGENT,
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(init?.headers ?? {})
      }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network request failed'
    throw new SyncProviderError('network_error', message)
  }
}

function requireToken(secrets: SyncSecrets): string {
  const token = secrets.githubToken?.trim()

  if (!token) {
    throw new SyncProviderError('token_required', 'GitHub token is required')
  }

  return token
}

function requireGistId(gistId: string | undefined): string {
  if (!gistId || !isValidGistId(gistId)) {
    throw new SyncProviderError('gist_not_found', 'Gist ID is invalid')
  }

  return gistId
}

function requireSyncContent(content: string): string {
  if (!content.trim()) {
    throw new SyncProviderError('invalid_request', 'Sync payload is empty')
  }

  return content
}

function extractGistFile(response: GistResponse): { content: string; updatedAt: string } {
  const file = response.files?.[SYNC_GIST_FILENAME]

  if (!file?.content?.trim()) {
    throw new SyncProviderError('gist_file_missing', 'Sync file not found in gist')
  }

  return {
    content: file.content,
    updatedAt: response.updated_at
  }
}

async function parseGistResponse(response: Response): Promise<GistResponse> {
  const body = await response.text()

  if (!response.ok) {
    throw mapHttpError(response.status, body)
  }

  return JSON.parse(body) as GistResponse
}

function buildCreateGistBody(content: string): string {
  return JSON.stringify({
    description: SYNC_GIST_DESCRIPTION,
    public: false,
    files: {
      [SYNC_GIST_FILENAME]: {
        content: requireSyncContent(content)
      }
    }
  })
}

function buildUpdateGistBody(content: string): string {
  return JSON.stringify({
    description: SYNC_GIST_DESCRIPTION,
    files: {
      [SYNC_GIST_FILENAME]: {
        content: requireSyncContent(content)
      }
    }
  })
}

export const githubGistProvider: SyncProvider = {
  async testConnection(config, secrets) {
    const token = requireToken(secrets)

    if (config.gistId) {
      const gistId = requireGistId(config.gistId)
      const response = await githubRequest(token, `/${gistId}`)
      await parseGistResponse(response)
      return
    }

    const response = await githubRequest(token, '')
    if (!response.ok) {
      const body = await response.text()
      throw mapHttpError(response.status, body)
    }
  },

  async ensureRemote(config, secrets, initialContent): Promise<SyncProviderEnsureResult> {
    const token = requireToken(secrets)
    const content = requireSyncContent(initialContent)

    if (config.gistId) {
      const gistId = requireGistId(config.gistId)
      const response = await githubRequest(token, `/${gistId}`)
      const gist = await parseGistResponse(response)
      return { gistId: gist.id }
    }

    const response = await githubRequest(token, '', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: buildCreateGistBody(content)
    })

    const gist = await parseGistResponse(response)
    return {
      gistId: gist.id,
      updatedAt: gist.updated_at,
      created: true
    }
  },

  async push(content, _config, secrets, gistId) {
    const token = requireToken(secrets)
    const normalizedGistId = requireGistId(gistId)

    const response = await githubRequest(token, `/${normalizedGistId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: buildUpdateGistBody(content)
    })

    const gist = await parseGistResponse(response)
    return { updatedAt: gist.updated_at }
  },

  async pull(_config, secrets, gistId) {
    const token = requireToken(secrets)
    const normalizedGistId = requireGistId(gistId)
    const response = await githubRequest(token, `/${normalizedGistId}`)
    const gist = await parseGistResponse(response)
    const file = extractGistFile(gist)

    return {
      content: file.content,
      updatedAt: file.updatedAt
    }
  }
}

export function toSyncError(error: unknown): SyncError {
  if (error instanceof SyncProviderError) {
    return { code: error.code, message: error.message }
  }

  if (error instanceof Error) {
    if (error.message === 'GitHub token is required') {
      return { code: 'token_required', message: error.message }
    }

    if (error.message === 'Safe storage is not available') {
      return { code: 'safe_storage_unavailable', message: error.message }
    }

    return { code: 'unknown', message: error.message }
  }

  return { code: 'unknown', message: 'Unknown sync error' }
}
