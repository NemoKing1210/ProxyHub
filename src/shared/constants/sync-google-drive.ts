import { SYNC_GIST_FILENAME } from './sync'

export const GOOGLE_DRIVE_SYNC_FILENAME = SYNC_GIST_FILENAME

export const GOOGLE_DRIVE_APPDATA_SCOPE = 'https://www.googleapis.com/auth/drive.appdata'

export const GOOGLE_OAUTH_SCOPES = [
  GOOGLE_DRIVE_APPDATA_SCOPE,
  'https://www.googleapis.com/auth/userinfo.email'
].join(' ')

export const GOOGLE_OAUTH_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'

export const GOOGLE_OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token'

export const GOOGLE_DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3'

export const GOOGLE_DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3'

export const GOOGLE_OAUTH_REDIRECT_PATH = '/oauth2callback'

export const GOOGLE_OAUTH_TIMEOUT_MS = 5 * 60 * 1000

export const GOOGLE_CLOUD_CONSOLE_URL =
  'https://console.cloud.google.com/apis/credentials' as const
