import { ipcMain } from 'electron'
import type { AppSettings } from '@shared/types/settings'
import { syncLaunchAtLoginFromSettings } from '../services/auto-launch'
import { getSettings, saveSettings } from '../services/app-store'
import { refreshTrayContextMenu } from '../services/tray'
import { logger, setLogLevel } from '../services/logger'
import { syncTrayEnabled } from './tray'
function shouldSyncLaunchAtLogin(previous: AppSettings, next: AppSettings): boolean {
  return (
    previous.launchAtLogin !== next.launchAtLogin ||
    previous.startMinimized !== next.startMinimized ||
    previous.trayEnabled !== next.trayEnabled
  )
}
export function registerSettingsIpc(): void {
  const log = logger.scope('ipc:settings')

  ipcMain.handle('settings:get', async () => {
    log.info('settings:get invoked')
    try {
      const result = await getSettings()
      log.debug('settings:get succeeded')
      return result
    } catch (error) {
      log.error('settings:get failed', error)
      throw error
    }
  })

  ipcMain.handle('settings:save', async (_event, settings: AppSettings) => {
    log.info('settings:save invoked', {
      logLevel: settings.logLevel,
      language: settings.language,
      trayEnabled: settings.trayEnabled,
      launchAtLogin: settings.launchAtLogin
    })
    try {
      const previous = await getSettings()
      await saveSettings(settings)

      if (previous.logLevel !== settings.logLevel) {
        setLogLevel(settings.logLevel)
      }

      if (shouldSyncLaunchAtLogin(previous, settings)) {
        syncLaunchAtLoginFromSettings(settings)
      }

      if (previous.trayEnabled !== settings.trayEnabled) {
        await syncTrayEnabled(settings.trayEnabled)
        log.debug('settings:save succeeded')
        return
      }

      if (settings.trayEnabled && previous.language !== settings.language) {
        await refreshTrayContextMenu()
      }
      log.debug('settings:save succeeded')
    } catch (error) {
      log.error('settings:save failed', error)
      throw error
    }
  })
}
