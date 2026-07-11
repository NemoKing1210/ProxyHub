import { createHash, randomBytes } from 'crypto'
import { createServer, type ServerResponse } from 'http'
import { shell } from 'electron'
import {
  GOOGLE_OAUTH_SCOPES,
  GOOGLE_OAUTH_AUTH_URL,
  GOOGLE_OAUTH_REDIRECT_PATH,
  GOOGLE_OAUTH_TIMEOUT_MS,
  GOOGLE_OAUTH_TOKEN_URL
} from '../../../shared/constants/sync-google-drive'
import type { SyncError } from '../../../shared/types/sync'
import { readGoogleOAuthClientIdFromEnv } from '../../config/google-oauth-env'
import { saveGoogleOAuthTokens, type GoogleOAuthTokens } from '../sync-secrets'
import { SyncProviderError, toSyncError } from './providers/sync-errors'

const USER_AGENT = 'ProxyChecker-Sync'

interface GoogleTokenResponse {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  token_type?: string
  scope?: string
  error?: string
  error_description?: string
}

interface GoogleUserInfoResponse {
  email?: string
}

function base64UrlEncode(buffer: Buffer): string {
  return buffer.toString('base64url')
}

function generatePkce(): { verifier: string; challenge: string } {
  const verifier = base64UrlEncode(randomBytes(32))
  const challenge = base64UrlEncode(createHash('sha256').update(verifier).digest())
  return { verifier, challenge }
}

async function resolveGoogleOAuthClientId(): Promise<string> {
  const clientId = readGoogleOAuthClientIdFromEnv()

  if (!clientId) {
    throw new SyncProviderError(
      'google_oauth_not_configured',
      'Google OAuth Client ID is not configured'
    )
  }

  return clientId
}

function buildSuccessHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>ProxyChecker</title>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #0f1419; color: #e7ecf2; }
    .card { text-align: center; padding: 2rem; border-radius: 12px; background: #171d24; box-shadow: 0 8px 32px rgba(0,0,0,.35); }
    h1 { font-size: 1.25rem; margin: 0 0 .5rem; }
    p { margin: 0; color: #9aa7b5; }
  </style>
</head>
<body>
  <div class="card">
    <h1>ProxyChecker</h1>
    <p>Google account connected. You can close this tab and return to the app.</p>
  </div>
</body>
</html>`
}

function buildErrorHtml(message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>ProxyChecker</title>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #0f1419; color: #e7ecf2; }
    .card { text-align: center; padding: 2rem; border-radius: 12px; background: #171d24; box-shadow: 0 8px 32px rgba(0,0,0,.35); max-width: 420px; }
    h1 { font-size: 1.25rem; margin: 0 0 .5rem; color: #ff8a80; }
    p { margin: 0; color: #9aa7b5; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Connection failed</h1>
    <p>${message}</p>
  </div>
</body>
</html>`
}

function sendHtml(response: ServerResponse, statusCode: number, html: string): void {
  response.writeHead(statusCode, { 'Content-Type': 'text/html; charset=utf-8' })
  response.end(html)
}

async function exchangeAuthorizationCode(
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<GoogleOAuthTokens> {
  const clientId = await resolveGoogleOAuthClientId()

  let response: Response

  try {
    response = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': USER_AGENT
      },
      body: new URLSearchParams({
        client_id: clientId,
        code,
        code_verifier: codeVerifier,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
      })
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network request failed'
    throw new SyncProviderError('network_error', message)
  }

  const body = (await response.json()) as GoogleTokenResponse

  if (!response.ok || !body.access_token) {
    throw new SyncProviderError(
      'invalid_token',
      body.error_description || body.error || 'Failed to exchange Google authorization code'
    )
  }

  const expiresAt =
    typeof body.expires_in === 'number'
      ? new Date(Date.now() + body.expires_in * 1000).toISOString()
      : undefined

  return {
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
    expiresAt
  }
}

async function fetchGoogleEmail(accessToken: string): Promise<string | undefined> {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': USER_AGENT
      }
    })

    if (!response.ok) {
      return undefined
    }

    const body = (await response.json()) as GoogleUserInfoResponse
    return body.email?.trim() || undefined
  } catch {
    return undefined
  }
}

export async function refreshGoogleAccessToken(refreshToken: string): Promise<GoogleOAuthTokens> {
  const clientId = await resolveGoogleOAuthClientId()

  let response: Response

  try {
    response = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': USER_AGENT
      },
      body: new URLSearchParams({
        client_id: clientId,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network request failed'
    throw new SyncProviderError('network_error', message)
  }

  const body = (await response.json()) as GoogleTokenResponse

  if (!response.ok || !body.access_token) {
    throw new SyncProviderError(
      'invalid_token',
      body.error_description || body.error || 'Failed to refresh Google access token'
    )
  }

  const expiresAt =
    typeof body.expires_in === 'number'
      ? new Date(Date.now() + body.expires_in * 1000).toISOString()
      : undefined

  return {
    accessToken: body.access_token,
    refreshToken: body.refresh_token ?? refreshToken,
    expiresAt
  }
}

export async function resolveGoogleAccessToken(secrets: {
  googleAccessToken?: string
  googleRefreshToken?: string
  googleTokenExpiresAt?: string
}): Promise<string> {
  const accessToken = secrets.googleAccessToken?.trim()
  const refreshToken = secrets.googleRefreshToken?.trim()
  const expiresAt = secrets.googleTokenExpiresAt

  if (!accessToken && !refreshToken) {
    throw new SyncProviderError('auth_required', 'Google account is not connected')
  }

  const expiresSoon = expiresAt && Date.parse(expiresAt) - Date.now() < 60_000

  if (accessToken && !expiresSoon) {
    return accessToken
  }

  if (!refreshToken) {
    if (accessToken) {
      return accessToken
    }

    throw new SyncProviderError('auth_required', 'Google account is not connected')
  }

  const refreshed = await refreshGoogleAccessToken(refreshToken)
  await saveGoogleOAuthTokens(refreshed)
  return refreshed.accessToken
}

async function startCallbackServer(): Promise<{
  redirectUri: string
  waitForCode: () => Promise<string>
}> {
  return new Promise((resolve, reject) => {
    const server = createServer()

    server.on('error', reject)

    server.listen(0, '127.0.0.1', () => {
      const address = server.address()

      if (!address || typeof address === 'string') {
        server.close()
        reject(new Error('Failed to start OAuth callback server'))
        return
      }

      const redirectUri = `http://127.0.0.1:${address.port}${GOOGLE_OAUTH_REDIRECT_PATH}`

      const waitForCode = (): Promise<string> =>
        new Promise((resolveCode, rejectCode) => {
          const timeout = setTimeout(() => {
            server.close()
            rejectCode(new SyncProviderError('auth_cancelled', 'Google sign-in timed out'))
          }, GOOGLE_OAUTH_TIMEOUT_MS)

          server.on('request', (request, response) => {
            void (async () => {
              if (!request.url) {
                sendHtml(response, 400, buildErrorHtml('Invalid callback request'))
                return
              }

              try {
                const callbackUrl = new URL(request.url, redirectUri)

                if (callbackUrl.pathname !== GOOGLE_OAUTH_REDIRECT_PATH) {
                  sendHtml(response, 404, buildErrorHtml('Not found'))
                  return
                }

                const error = callbackUrl.searchParams.get('error')

                if (error) {
                  const description = callbackUrl.searchParams.get('error_description') || error
                  sendHtml(response, 400, buildErrorHtml(description))
                  clearTimeout(timeout)
                  server.close()
                  rejectCode(
                    new SyncProviderError('auth_cancelled', 'Google sign-in was cancelled')
                  )
                  return
                }

                const code = callbackUrl.searchParams.get('code')

                if (!code) {
                  sendHtml(response, 400, buildErrorHtml('Authorization code is missing'))
                  clearTimeout(timeout)
                  server.close()
                  rejectCode(
                    new SyncProviderError('invalid_request', 'Authorization code is missing')
                  )
                  return
                }

                sendHtml(response, 200, buildSuccessHtml())
                clearTimeout(timeout)
                server.close()
                resolveCode(code)
              } catch (error) {
                const message = error instanceof Error ? error.message : 'OAuth callback failed'
                sendHtml(response, 500, buildErrorHtml(message))
                clearTimeout(timeout)
                server.close()
                rejectCode(error)
              }
            })()
          })
        })

      resolve({ redirectUri, waitForCode })
    })
  })
}

export async function connectGoogleAccount(): Promise<{ email?: string }> {
  const clientId = await resolveGoogleOAuthClientId()

  const { verifier, challenge } = generatePkce()
  const { redirectUri, waitForCode } = await startCallbackServer()

  const authUrl = new URL(GOOGLE_OAUTH_AUTH_URL)
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', GOOGLE_OAUTH_SCOPES)
  authUrl.searchParams.set('access_type', 'offline')
  authUrl.searchParams.set('prompt', 'consent')
  authUrl.searchParams.set('code_challenge', challenge)
  authUrl.searchParams.set('code_challenge_method', 'S256')

  const codePromise = waitForCode()
  await shell.openExternal(authUrl.toString())

  const code = await codePromise
  const tokens = await exchangeAuthorizationCode(code, verifier, redirectUri)
  const email = await fetchGoogleEmail(tokens.accessToken)

  await saveGoogleOAuthTokens({
    ...tokens,
    email
  })

  return { email }
}

export async function disconnectGoogleAccount(): Promise<void> {
  const { saveSyncSecrets } = await import('../sync-secrets')
  await saveSyncSecrets({ clearGoogleAuth: true })
}

export function mapGoogleConnectError(error: unknown): SyncError {
  return toSyncError(error)
}
