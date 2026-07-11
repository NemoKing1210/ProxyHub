import { ipcMain } from 'electron'
import type { AppUpdateState } from '../../shared/types/updater'
import {
  checkForUpdates,
  downloadUpdate,
  getUpdateState,
  quitAndInstallUpdate
} from '../services/auto-updater'

export function registerUpdaterIpc(): void {
  ipcMain.handle('updater:get-state', async (): Promise<AppUpdateState> => getUpdateState())
  ipcMain.handle('updater:check', async (): Promise<AppUpdateState> => checkForUpdates())
  ipcMain.handle('updater:download', async (): Promise<AppUpdateState> => downloadUpdate())
  ipcMain.handle('updater:install', async (): Promise<void> => {
    quitAndInstallUpdate()
  })
}
