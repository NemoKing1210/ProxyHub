const GIST_ID_PATTERN = /^[a-f0-9]{32}$/i
const GIST_URL_PATTERN = /gist\.github\.com\/(?:[^/?#]+\/)?([a-f0-9]{32})/i
const DRIVE_FILE_ID_PATTERN = /^[a-zA-Z0-9_-]{10,}$/

export function normalizeGistRemoteId(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()

  if (!trimmed) {
    return undefined
  }

  const urlMatch = trimmed.match(GIST_URL_PATTERN)

  if (urlMatch?.[1]) {
    return urlMatch[1].toLowerCase()
  }

  if (GIST_ID_PATTERN.test(trimmed)) {
    return trimmed.toLowerCase()
  }

  return undefined
}

export function isValidGistRemoteId(value: string | undefined): value is string {
  return typeof value === 'string' && GIST_ID_PATTERN.test(value)
}

export function normalizeDriveRemoteId(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()

  if (!trimmed || !DRIVE_FILE_ID_PATTERN.test(trimmed)) {
    return undefined
  }

  return trimmed
}

export function isValidDriveRemoteId(value: string | undefined): value is string {
  return typeof value === 'string' && DRIVE_FILE_ID_PATTERN.test(value)
}
