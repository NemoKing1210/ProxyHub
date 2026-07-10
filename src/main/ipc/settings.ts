import { ipcMain } from 'electron'
import type { AppSettings } from '../../shared/types/settings'
import { getSettings, saveSettings } from '../services/app-store'
import { refreshTrayContextMenu } from '../services/tray'
import { notifyTrayDataChanged, syncTrayEnabled } from './tray'

export function registerSettingsIpc(): void {
  ipcMain.handle('settings:get', async () => getSettings())

  ipcMain.handle('settings:save', async (_event, settings: AppSettings) => {
    const previous = await getSettings()
    await saveSettings(settings)

    if (previous.trayEnabled !== settings.trayEnabled) {
      await syncTrayEnabled(settings.trayEnabled)
    } else if (settings.trayEnabled) {
      await refreshTrayContextMenu()
    }

    notifyTrayDataChanged()
  })
}
