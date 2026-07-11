import { safeStorage } from 'electron'

const SECRET_KEYS = {
  githubToken: 'sync.githubToken',
  googleAccessToken: 'sync.googleAccessToken',
  googleRefreshToken: 'sync.googleRefreshToken',
  googleTokenExpiresAt: 'sync.googleTokenExpiresAt',
  googleEmail: 'sync.googleEmail',
  payloadPassword: 'sync.payloadPassword'
} as const

type SecretKey = keyof typeof SECRET_KEYS

interface SecretStoreSchema {
  [SECRET_KEYS.githubToken]?: string
  [SECRET_KEYS.googleAccessToken]?: string
  [SECRET_KEYS.googleRefreshToken]?: string
  [SECRET_KEYS.googleTokenExpiresAt]?: string
  [SECRET_KEYS.googleEmail]?: string
  [SECRET_KEYS.payloadPassword]?: string
}

let storePromise: Promise<{
  get: (key: string) => unknown
  set: (key: string, value: unknown) => void
  delete: (key: string) => void
}> | null = null

async function getSecretStore() {
  if (!storePromise) {
    storePromise = import('electron-store').then(({ default: Store }) => {
      return new Store<SecretStoreSchema>({
        name: 'proxy-checker-secrets',
        defaults: {}
      })
    })
  }

  return storePromise
}

export function isSafeStorageAvailable(): boolean {
  return safeStorage.isEncryptionAvailable()
}

function encryptSecret(value: string): string {
  if (!isSafeStorageAvailable()) {
    throw new Error('Safe storage is not available')
  }

  return safeStorage.encryptString(value).toString('base64')
}

function decryptSecret(encoded: string): string {
  if (!isSafeStorageAvailable()) {
    throw new Error('Safe storage is not available')
  }

  return safeStorage.decryptString(Buffer.from(encoded, 'base64'))
}

async function readSecret(key: SecretKey): Promise<string | undefined> {
  const store = await getSecretStore()
  const encoded = store.get(SECRET_KEYS[key])

  if (typeof encoded !== 'string' || !encoded) {
    return undefined
  }

  try {
    return decryptSecret(encoded)
  } catch {
    return undefined
  }
}

async function writeSecret(key: SecretKey, value: string): Promise<void> {
  const store = await getSecretStore()
  store.set(SECRET_KEYS[key], encryptSecret(value))
}

async function clearSecret(key: SecretKey): Promise<void> {
  const store = await getSecretStore()
  store.delete(SECRET_KEYS[key])
}

export interface SyncSecrets {
  githubToken?: string
  googleAccessToken?: string
  googleRefreshToken?: string
  googleTokenExpiresAt?: string
  googleEmail?: string
  payloadPassword?: string
}

export interface GoogleOAuthTokens {
  accessToken: string
  refreshToken?: string
  expiresAt?: string
  email?: string
}

export async function getSyncSecrets(): Promise<SyncSecrets> {
  const [githubToken, googleAccessToken, googleRefreshToken, googleTokenExpiresAt, googleEmail, payloadPassword] =
    await Promise.all([
      readSecret('githubToken'),
      readSecret('googleAccessToken'),
      readSecret('googleRefreshToken'),
      readSecret('googleTokenExpiresAt'),
      readSecret('googleEmail'),
      readSecret('payloadPassword')
    ])

  return {
    githubToken,
    googleAccessToken,
    googleRefreshToken,
    googleTokenExpiresAt,
    googleEmail,
    payloadPassword
  }
}

export async function hasGithubToken(): Promise<boolean> {
  const token = await readSecret('githubToken')
  return Boolean(token?.trim())
}

export async function hasGoogleAuth(): Promise<boolean> {
  const refreshToken = await readSecret('googleRefreshToken')
  const accessToken = await readSecret('googleAccessToken')
  return Boolean(refreshToken?.trim() || accessToken?.trim())
}

export async function getGoogleEmail(): Promise<string | undefined> {
  const email = await readSecret('googleEmail')
  return email?.trim() || undefined
}

export async function hasProviderCredentials(provider: 'github-gist' | 'google-drive'): Promise<boolean> {
  if (provider === 'github-gist') {
    return hasGithubToken()
  }

  return hasGoogleAuth()
}

export async function hasPayloadPassword(): Promise<boolean> {
  const password = await readSecret('payloadPassword')
  return Boolean(password)
}

export async function saveSyncSecrets(input: {
  githubToken?: string
  payloadPassword?: string
  clearGithubToken?: boolean
  clearGoogleAuth?: boolean
  clearPayloadPassword?: boolean
}): Promise<void> {
  if (!isSafeStorageAvailable()) {
    throw new Error('Safe storage is not available')
  }

  if (input.clearGithubToken) {
    await clearSecret('githubToken')
  } else if (input.githubToken !== undefined) {
    const token = input.githubToken.trim()
    if (token) {
      await writeSecret('githubToken', token)
    } else {
      await clearSecret('githubToken')
    }
  }

  if (input.clearGoogleAuth) {
    await Promise.all([
      clearSecret('googleAccessToken'),
      clearSecret('googleRefreshToken'),
      clearSecret('googleTokenExpiresAt'),
      clearSecret('googleEmail')
    ])
  }

  if (input.clearPayloadPassword) {
    await clearSecret('payloadPassword')
  } else if (input.payloadPassword !== undefined) {
    const password = input.payloadPassword
    if (password) {
      await writeSecret('payloadPassword', password)
    } else {
      await clearSecret('payloadPassword')
    }
  }
}

export async function saveGoogleOAuthTokens(tokens: GoogleOAuthTokens): Promise<void> {
  if (!isSafeStorageAvailable()) {
    throw new Error('Safe storage is not available')
  }

  await writeSecret('googleAccessToken', tokens.accessToken)

  if (tokens.refreshToken) {
    await writeSecret('googleRefreshToken', tokens.refreshToken)
  }

  if (tokens.expiresAt) {
    await writeSecret('googleTokenExpiresAt', tokens.expiresAt)
  } else {
    await clearSecret('googleTokenExpiresAt')
  }

  if (tokens.email) {
    await writeSecret('googleEmail', tokens.email)
  } else {
    await clearSecret('googleEmail')
  }
}

export async function requireGithubToken(): Promise<string> {
  const token = await readSecret('githubToken')

  if (!token?.trim()) {
    throw new Error('GitHub token is required')
  }

  return token.trim()
}

export async function resolvePayloadPassword(
  override?: string,
  encryptPayload?: boolean
): Promise<string | undefined> {
  if (override) {
    return override
  }

  if (!encryptPayload) {
    return undefined
  }

  return readSecret('payloadPassword')
}
