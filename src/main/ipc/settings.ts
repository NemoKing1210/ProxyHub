import { ipcMain } from 'electron'
import type { AppSettings } from '@shared/types/settings'
import { syncLaunchAtLoginFromSettings } from '../services/auto-launch'
import { getSettings, saveSettings } from '../services/app-store'
import { refreshTrayContextMenu } from '../services/tray'
import { syncTrayEnabled } from './tray'

function shouldSyncLaunchAtLogin(previous: AppSettings, next: AppSettings): boolean {
  return (
    previous.launchAtLogin !== next.launchAtLogin ||
    previous.startMinimized !== next.startMinimized ||
    previous.trayEnabled !== next.trayEnabled
  )
}

export function registerSettingsIpc(): void {
  ipcMain.handle('settings:get', async () => getSettings())

  ipcMain.handle('settings:save', async (_event, settings: AppSettings) => {
    const previous = await getSettings()
    await saveSettings(settings)

    if (shouldSyncLaunchAtLogin(previous, settings)) {
      syncLaunchAtLoginFromSettings(settings)
    }

    if (previous.trayEnabled !== settings.trayEnabled) {
      await syncTrayEnabled(settings.trayEnabled)
      return
    }

    if (settings.trayEnabled && previous.language !== settings.language) {
      await refreshTrayContextMenu()
    }
  })
}
