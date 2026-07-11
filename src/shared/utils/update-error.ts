export type AppUpdateErrorCode = 'unavailable' | 'network'

const NETWORK_ERROR_PATTERNS = [
  'enotfound',
  'econnrefused',
  'econnreset',
  'etimedout',
  'enetunreach',
  'network',
  'net::',
  'timeout',
  'offline',
  'socket hang up'
] as const

const UNAVAILABLE_ERROR_PATTERNS = [
  '404',
  '403',
  '401',
  'releases.atom',
  'not found',
  'authentication token'
] as const

export function resolveUpdateErrorCode(message: string): AppUpdateErrorCode {
  const normalized = message.toLowerCase()

  if (NETWORK_ERROR_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    return 'network'
  }

  if (UNAVAILABLE_ERROR_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    return 'unavailable'
  }

  return 'unavailable'
}
