import type { LogLevel } from '@shared/types/logger'

export interface ScopedLogger {
  debug: (message: string, meta?: unknown) => void
  info: (message: string, meta?: unknown) => void
  warn: (message: string, meta?: unknown) => void
  error: (message: string, meta?: unknown) => void
}

function emit(level: LogLevel, scope: string | undefined, message: string, meta: unknown): void {
  try {
    const win = window as unknown as { api?: unknown }
    if (
      win &&
      typeof win === 'object' &&
      'api' in win &&
      win.api !== null &&
      typeof win.api === 'object' &&
      'log' in win.api &&
      typeof (win.api as { log?: unknown }).log === 'function'
    ) {
      const log = (
        win.api as {
          log: (entry: {
            level: LogLevel
            scope?: string
            message: string
            meta?: unknown
          }) => Promise<void>
        }
      ).log
      void log({ level, scope, message, meta }).catch(() => {
        // ignore IPC failures
      })
    }
  } catch {
    // never throw from logger
  }
}

function createScoped(scope: string): ScopedLogger {
  return {
    debug: (message, meta) => emit('debug', scope, message, meta),
    info: (message, meta) => emit('info', scope, message, meta),
    warn: (message, meta) => emit('warn', scope, message, meta),
    error: (message, meta) => emit('error', scope, message, meta)
  }
}

export const logger: ScopedLogger & {
  scope: (name: string) => ScopedLogger
  debug: ScopedLogger['debug']
  info: ScopedLogger['info']
  warn: ScopedLogger['warn']
  error: ScopedLogger['error']
} = {
  debug: (message, meta) => emit('debug', undefined, message, meta),
  info: (message, meta) => emit('info', undefined, message, meta),
  warn: (message, meta) => emit('warn', undefined, message, meta),
  error: (message, meta) => emit('error', undefined, message, meta),
  scope: createScoped
}
