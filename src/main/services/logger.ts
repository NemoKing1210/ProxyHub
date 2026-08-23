import { app, shell } from 'electron'
import { appendFile, mkdir, readdir, stat, unlink } from 'fs/promises'
import { isAbsolute, join, relative, resolve } from 'path'
import {
  DEFAULT_LOG_LEVEL,
  isLogLevel,
  LOG_FILE_PREFIX,
  LOG_LEVEL_RANK,
  LOG_RETENTION_DAYS,
  normalizeLogLevel,
  type LogFileInfo,
  type LogLevel,
  type LogsInfo
} from '@shared/types/logger'

const FLUSH_INTERVAL_MS = 120
const MAX_QUEUE_BEFORE_FLUSH = 40
const MAX_META_STRING_LENGTH = 4000

let currentLevel: LogLevel = DEFAULT_LOG_LEVEL
let logsDir: string | null = null
let queue: string[] = []
let flushTimer: NodeJS.Timeout | null = null
let isInitialized = false
let flushInProgress = false
let pendingPruneTimer: NodeJS.Timeout | null = null

function resolveLogsDir(): string {
  try {
    return app.getPath('logs')
  } catch {
    return join(app.getPath('userData'), 'logs')
  }
}

function formatTimestamp(date: Date): string {
  return date.toISOString()
}

function formatLevel(level: LogLevel): string {
  return level.toUpperCase().padEnd(5, ' ')
}

function safeStringify(value: unknown): string {
  if (value === undefined) return 'undefined'
  if (typeof value === 'string') return value
  try {
    const text = JSON.stringify(value, (_key, val) => {
      if (val instanceof Error) {
        return { name: val.name, message: val.message, stack: val.stack }
      }
      return val
    })
    if (text.length > MAX_META_STRING_LENGTH) {
      return `${text.slice(0, MAX_META_STRING_LENGTH)}…(truncated)`
    }
    return text
  } catch {
    return String(value)
  }
}

function buildLine(
  level: LogLevel,
  scope: string | undefined,
  message: string,
  meta: unknown
): string {
  const timestamp = formatTimestamp(new Date())
  const levelStr = formatLevel(level)
  const scopePart = scope ? ` [${scope}]` : ''
  const metaPart = meta !== undefined ? ` ${safeStringify(meta)}` : ''
  return `[${timestamp}] [${levelStr}]${scopePart} ${message}${metaPart}\n`
}

function getFileNameForDate(date: Date): string {
  const yyyy = String(date.getFullYear())
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${LOG_FILE_PREFIX}${yyyy}-${mm}-${dd}.log`
}

function getCurrentLogFilePath(): string {
  const dir = logsDir ?? resolveLogsDir()
  return join(dir, getFileNameForDate(new Date()))
}

function shouldLog(level: LogLevel): boolean {
  if (currentLevel === 'off') return false
  if (level === 'off') return false
  return LOG_LEVEL_RANK[level] <= LOG_LEVEL_RANK[currentLevel]
}

function scheduleFlush(): void {
  if (flushTimer) return
  const delay = queue.length >= MAX_QUEUE_BEFORE_FLUSH ? 0 : FLUSH_INTERVAL_MS
  flushTimer = setTimeout(() => {
    flushTimer = null
    void flushQueue()
  }, delay)
  if (delay === 0) {
    flushTimer?.unref?.()
  }
}

async function flushQueue(): Promise<void> {
  if (flushInProgress) {
    scheduleFlush()
    return
  }
  if (queue.length === 0) return

  const batch = queue.join('')
  queue = []

  if (flushTimer) {
    clearTimeout(flushTimer)
    flushTimer = null
  }

  flushInProgress = true
  try {
    const filePath = getCurrentLogFilePath()
    const dir = logsDir ?? resolveLogsDir()
    await mkdir(dir, { recursive: true })
    await appendFile(filePath, batch, 'utf-8')
  } catch {
    // Logger must never throw; file errors are silently ignored
  } finally {
    flushInProgress = false
    if (queue.length > 0) {
      scheduleFlush()
    }
  }
}

function enqueue(level: LogLevel, scope: string | undefined, message: string, meta: unknown): void {
  if (!shouldLog(level)) return
  const line = buildLine(level, scope, message, meta)
  queue.push(line)
  // Always mirror errors/warns to console for dev visibility when debug tracing is on
  if (level === 'error') {
    console.error(line.trim())
  } else if (level === 'warn' && currentLevel === 'debug') {
    console.warn(line.trim())
  }
  scheduleFlush()
}

async function pruneOldLogs(): Promise<void> {
  try {
    const dir = logsDir ?? resolveLogsDir()
    const entries = await readdir(dir)
    const now = Date.now()
    const maxAgeMs = LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000

    await Promise.all(
      entries
        .filter((name) => name.startsWith(LOG_FILE_PREFIX) && name.endsWith('.log'))
        .map(async (name) => {
          const fullPath = join(dir, name)
          try {
            const info = await stat(fullPath)
            if (now - info.mtimeMs > maxAgeMs) {
              await unlink(fullPath)
            }
          } catch {
            // ignore per-file errors
          }
        })
    )
  } catch {
    // ignore missing dir
  }
}

function schedulePrune(): void {
  if (pendingPruneTimer) return
  pendingPruneTimer = setTimeout(
    () => {
      pendingPruneTimer = null
      void pruneOldLogs()
    },
    60 * 60 * 1000
  )
  pendingPruneTimer.unref?.()
}

export function getLogsDir(): string {
  return logsDir ?? resolveLogsDir()
}

export function getCurrentLevel(): LogLevel {
  return currentLevel
}

export function setLogLevel(level: LogLevel): void {
  const normalized = normalizeLogLevel(level)
  const previous = currentLevel
  currentLevel = normalized
  if (previous !== normalized) {
    // Log level change itself — always emitted as info so it's visible even when switching from off
    const line = buildLine(
      'info',
      'logger',
      `Log level changed: ${previous} -> ${normalized}`,
      undefined
    )
    // Bypass shouldLog check for this meta event — push directly if not off
    if (normalized !== 'off') {
      queue.push(line)
      scheduleFlush()
    }
  }
}

export async function initLogger(): Promise<void> {
  if (isInitialized) return
  isInitialized = true

  logsDir = resolveLogsDir()
  try {
    await mkdir(logsDir, { recursive: true })
  } catch {
    // ignore
  }

  try {
    const { getSettings } = await import('./app-store')
    const settings = await getSettings()
    currentLevel = normalizeLogLevel(settings.logLevel)
  } catch {
    currentLevel = DEFAULT_LOG_LEVEL
  }

  // Global crash handlers — always attempt to flush before exit
  process.on('uncaughtException', (error) => {
    enqueue('error', 'process', 'Uncaught exception', error)
    void flushQueue()
  })

  process.on('unhandledRejection', (reason) => {
    enqueue('error', 'process', 'Unhandled rejection', reason)
  })

  app.on('before-quit', () => {
    if (flushTimer) {
      clearTimeout(flushTimer)
      flushTimer = null
    }
    // Best-effort synchronous flush is not possible; enqueue final line and rely on quick async flush
    enqueue('info', 'app', 'Application quitting', undefined)
  })

  await pruneOldLogs()
  schedulePrune()

  enqueue('info', 'app', 'Logger initialized', { level: currentLevel, dir: logsDir })
}

export async function getLogsInfo(): Promise<LogsInfo> {
  const dir = getLogsDir()
  try {
    await mkdir(dir, { recursive: true })
  } catch {
    // ignore
  }

  let files: LogFileInfo[] = []
  try {
    const entries = await readdir(dir)
    const logNames = entries.filter(
      (name) => name.startsWith(LOG_FILE_PREFIX) && name.endsWith('.log')
    )
    const infos = await Promise.all(
      logNames.map(async (name): Promise<LogFileInfo | null> => {
        const fullPath = join(dir, name)
        try {
          const s = await stat(fullPath)
          const datePart = name.slice(LOG_FILE_PREFIX.length, -4)
          return {
            name,
            path: fullPath,
            size: s.size,
            mtimeMs: s.mtimeMs,
            date: datePart
          }
        } catch {
          return null
        }
      })
    )
    files = infos
      .filter((item): item is LogFileInfo => item !== null)
      .sort((a, b) => b.date.localeCompare(a.date))
  } catch {
    files = []
  }

  return {
    dir,
    files,
    currentFile: files.length > 0 ? getCurrentLogFilePath() : null
  }
}

export async function openLogsFolder(): Promise<string> {
  const dir = getLogsDir()
  await mkdir(dir, { recursive: true })
  const result = await shell.openPath(dir)
  if (result) {
    throw new Error(result)
  }
  return dir
}

export async function openLogFile(fileName: string): Promise<string> {
  const dir = getLogsDir()
  // Guard against path traversal: only allow files inside logs dir with expected prefix/extension
  const safeName = fileName.split('/').pop()?.split('\\').pop() ?? fileName
  if (!safeName.startsWith(LOG_FILE_PREFIX) || !safeName.endsWith('.log')) {
    throw new Error(`Invalid log file name: ${fileName}`)
  }
  const filePath = join(dir, safeName)
  // Ensure resolved path stays inside dir (cross-platform, handles \\ vs /)
  const resolvedDir = resolve(dir)
  const resolvedFile = resolve(filePath)
  const rel = relative(resolvedDir, resolvedFile)
  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new Error('Path traversal blocked')
  }
  try {
    await stat(resolvedFile)
  } catch {
    throw new Error(`Log file not found: ${safeName}`)
  }
  const result = await shell.openPath(resolvedFile)
  if (result) {
    throw new Error(result)
  }
  logger.scope('logger').info('Log file opened', { file: safeName })
  return resolvedFile
}

export async function clearLogs(): Promise<void> {
  await flushQueue()
  const dir = getLogsDir()
  try {
    await mkdir(dir, { recursive: true })
  } catch {
    return
  }
  const entries = await readdir(dir).catch(() => [] as string[])
  const logFiles = entries.filter(
    (name) => name.startsWith(LOG_FILE_PREFIX) && name.endsWith('.log')
  )
  await Promise.all(
    logFiles.map(async (name) => {
      try {
        await unlink(join(dir, name))
      } catch {
        // per-file ignore
      }
    })
  )
  logger.scope('logger').info('Logs cleared', { count: logFiles.length })
  // Enqueue after clear so the new file contains the clearing event
  queue.push(buildLine('info', 'logger', `Logs cleared (${logFiles.length} files)`, undefined))
  scheduleFlush()
}

export async function flushLogs(): Promise<void> {
  await flushQueue()
}
export interface ScopedLogger {
  debug: (message: string, meta?: unknown) => void
  info: (message: string, meta?: unknown) => void
  warn: (message: string, meta?: unknown) => void
  error: (message: string, meta?: unknown) => void
}

function createScoped(scope: string): ScopedLogger {
  return {
    debug: (message, meta) => enqueue('debug', scope, message, meta),
    info: (message, meta) => enqueue('info', scope, message, meta),
    warn: (message, meta) => enqueue('warn', scope, message, meta),
    error: (message, meta) => enqueue('error', scope, message, meta)
  }
}

export const logger: ScopedLogger & {
  scope: (name: string) => ScopedLogger
  debug: ScopedLogger['debug']
  info: ScopedLogger['info']
  warn: ScopedLogger['warn']
  error: ScopedLogger['error']
} = {
  debug: (message, meta) => enqueue('debug', undefined, message, meta),
  info: (message, meta) => enqueue('info', undefined, message, meta),
  warn: (message, meta) => enqueue('warn', undefined, message, meta),
  error: (message, meta) => enqueue('error', undefined, message, meta),
  scope: createScoped
}

export function writeRendererLog(entry: {
  level: LogLevel
  scope?: string
  message: string
  meta?: unknown
}): void {
  const level = isLogLevel(entry.level) ? entry.level : 'info'
  const scope =
    typeof entry.scope === 'string' && entry.scope.trim().length > 0
      ? entry.scope.trim()
      : 'renderer'
  const message = typeof entry.message === 'string' ? entry.message : String(entry.message ?? '')
  if (message.length === 0) return
  enqueue(level, scope, message, entry.meta)
}
