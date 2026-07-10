import { ipcMain } from 'electron'
import type { AppSettings } from '../../shared/types/settings'
import { getSettings, saveSettings } from '../services/app-store'

export function registerSettingsIpc(): void {
  ipcMain.handle('settings:get', async () => getSettings())

  ipcMain.handle('settings:save', async (_event, settings: AppSettings) => {
    await saveSettings(settings)
  })
}
