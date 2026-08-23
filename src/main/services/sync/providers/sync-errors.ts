import type { SyncError, SyncErrorCode } from '@shared/types/sync'

export class SyncProviderError extends Error {
  readonly code: SyncErrorCode

  constructor(code: SyncErrorCode, message: string) {
    super(message)
    this.name = 'SyncProviderError'
    this.code = code
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

    if (error.message === 'Google account is not connected') {
      return { code: 'auth_required', message: error.message }
    }

    if (error.message === 'Google OAuth Client ID is not configured') {
      return { code: 'google_oauth_not_configured', message: error.message }
    }

    if (error.message === 'Google sign-in was cancelled') {
      return { code: 'auth_cancelled', message: error.message }
    }

    if (error.message === 'Safe storage is not available') {
      return { code: 'safe_storage_unavailable', message: error.message }
    }

    return { code: 'unknown', message: error.message }
  }

  return { code: 'unknown', message: 'Unknown sync error' }
}
