import { ipcMain } from 'electron'
import {
  clearLogs,
  getLogsInfo,
  openLogFile,
  openLogsFolder,
  writeRendererLog
} from '../services/logger'
import { logger } from '../services/logger'
import { isLogLevel, type LogLevel } from '@shared/types/logger'
export function registerLoggerIpc(): void {
  const log = logger.scope('ipc:logger')

  ipcMain.handle('logs:get-info', async () => {
    log.info('logs:get-info invoked')
    try {
      const result = await getLogsInfo()
      log.debug('logs:get-info succeeded')
      return result
    } catch (error) {
      log.error('logs:get-info failed', error)
      throw error
    }
  })
  ipcMain.handle('logs:open-folder', async () => {
    log.info('logs:open-folder invoked')
    try {
      const result = await openLogsFolder()
      log.debug('logs:open-folder succeeded', { path: result })
      return result
    } catch (error) {
      log.error('logs:open-folder failed', error)
      throw error
    }
  })
  ipcMain.handle('logs:open-file', async (_event, fileName: string) => {
    log.info('logs:open-file invoked', { fileName })
    try {
      const result = await openLogFile(fileName)
      log.info('logs:open-file succeeded', { fileName })
      return result
    } catch (error) {
      log.error('logs:open-file failed', error)
      throw error
    }
  })
  ipcMain.handle('logs:clear', async () => {
    log.info('logs:clear invoked')
    try {
      await clearLogs()
      log.info('logs:clear succeeded')
    } catch (error) {
      log.error('logs:clear failed', error)
      throw error
    }
  })
  ipcMain.handle(
    'logs:write',
    (_event, entry: { level: LogLevel; scope?: string; message: string; meta?: unknown }) => {
      try {
        if (!entry || typeof entry.message !== 'string') {
          log.warn('logs:write received invalid entry', entry as unknown)
          return
        }
        if (!isLogLevel(entry.level)) {
          log.warn('logs:write received invalid level', entry as unknown)
          entry.level = 'info'
        }
        writeRendererLog(entry)
      } catch (error) {
        log.error('logs:write failed', error)
      }
    }
  )
}
