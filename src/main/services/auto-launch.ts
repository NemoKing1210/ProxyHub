import { app } from 'electron'
import type { AppSettings } from '@shared/types/settings'

export function syncLaunchAtLoginFromSettings(settings: AppSettings): void {
  if (!app.isPackaged) {
    return
  }

  const openAtLogin = settings.launchAtLogin === true
  const openAsHidden = openAtLogin && settings.trayEnabled && settings.startMinimized

  app.setLoginItemSettings({
    openAtLogin,
    path: process.execPath,
    openAsHidden
  })
}
