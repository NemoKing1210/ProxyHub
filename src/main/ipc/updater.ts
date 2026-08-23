import { ipcMain } from 'electron'
import type { AppUpdateState } from '@shared/types/updater'
import {
  checkForUpdates,
  downloadUpdate,
  getUpdateState,
  quitAndInstallUpdate
} from '../services/auto-updater'
import { logger } from '../services/logger'

export function registerUpdaterIpc(): void {
  const log = logger.scope('ipc:updater')

  ipcMain.handle('updater:get-state', async (): Promise<AppUpdateState> => {
    log.info('updater:get-state invoked')
    try {
      const result = await getUpdateState()
      log.debug('updater:get-state succeeded', { status: result.status })
      return result
    } catch (error) {
      log.error('updater:get-state failed', error)
      throw error
    }
  })
  ipcMain.handle('updater:check', async (): Promise<AppUpdateState> => {
    log.info('updater:check invoked')
    try {
      const result = await checkForUpdates()
      log.debug('updater:check succeeded', { status: result.status })
      return result
    } catch (error) {
      log.error('updater:check failed', error)
      throw error
    }
  })
  ipcMain.handle('updater:download', async (): Promise<AppUpdateState> => {
    log.info('updater:download invoked')
    try {
      const result = await downloadUpdate()
      log.debug('updater:download succeeded', { status: result.status })
      return result
    } catch (error) {
      log.error('updater:download failed', error)
      throw error
    }
  })
  ipcMain.handle('updater:install', async (): Promise<void> => {
    log.info('updater:install invoked')
    try {
      quitAndInstallUpdate()
      log.debug('updater:install succeeded')
    } catch (error) {
      log.error('updater:install failed', error)
      throw error
    }
  })
}
