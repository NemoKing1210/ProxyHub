export const SYNC_GIST_FILENAME = 'proxyhub-sync.pcbackup.json' as const

export const SYNC_GIST_DESCRIPTION = 'ProxyHub sync data' as const

export const SYNC_INTERVAL_MIN = 5

export const SYNC_INTERVAL_MAX = 1_440

export const SYNC_INTERVAL_DEFAULT = 30

export const SYNC_ON_CHANGE_DEBOUNCE_MS = 3_000

export const GITHUB_CREATE_TOKEN_URL =
  'https://github.com/settings/tokens/new?scopes=gist&description=ProxyHub%20Sync'

export const GITHUB_GIST_API_BASE = 'https://api.github.com/gists' as const
