export type LogLevel = 'off' | 'error' | 'warn' | 'info' | 'debug'

export const LOG_LEVELS: readonly LogLevel[] = ['off', 'error', 'warn', 'info', 'debug'] as const

export const DEFAULT_LOG_LEVEL: LogLevel = 'info'

export const LOG_RETENTION_DAYS = 14

export const LOG_FILE_PREFIX = 'proxyhub-'

export const LOG_LEVEL_RANK: Record<LogLevel, number> = {
  off: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4
}

export function isLogLevel(value: unknown): value is LogLevel {
  return typeof value === 'string' && (LOG_LEVELS as readonly string[]).includes(value)
}

export function normalizeLogLevel(value: unknown): LogLevel {
  return isLogLevel(value) ? value : DEFAULT_LOG_LEVEL
}

export function shouldLogMessage(level: LogLevel, configured: LogLevel): boolean {
  if (configured === 'off') return false
  return LOG_LEVEL_RANK[level] <= LOG_LEVEL_RANK[configured]
}

export interface LogFileInfo {
  name: string
  path: string
  size: number
  mtimeMs: number
  date: string
}

export interface LogsInfo {
  dir: string
  files: LogFileInfo[]
  currentFile: string | null
}
