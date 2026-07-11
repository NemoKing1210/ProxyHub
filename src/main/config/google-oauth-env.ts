export function readGoogleOAuthClientIdFromEnv(): string {
  return process.env.GOOGLE_OAUTH_CLIENT_ID?.trim() ?? ''
}

export function isGoogleOAuthClientIdConfigured(): boolean {
  return Boolean(readGoogleOAuthClientIdFromEnv())
}
