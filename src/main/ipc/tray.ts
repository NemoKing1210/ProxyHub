import { ipcMain } from 'electron'
import {
  createTray,
  destroyTray,
  refreshTrayContextMenu,
  refreshTrayTooltip
} from '../services/tray'
import { notifyTrayDataChanged } from '../services/tray-actions'
import { hideMainWindow, showMainWindow } from '../services/main-window'
import { setTrayEnabledState } from '../services/tray-state'
import { logger } from '../services/logger'
export async function syncTrayEnabled(enabled: boolean): Promise<void> {
  setTrayEnabledState(enabled)

  if (enabled) {
    createTray()
    refreshTrayTooltip()
    await refreshTrayContextMenu()
    return
  }

  destroyTray()
}

export function registerTrayIpc(): void {
  const log = logger.scope('ipc:tray')

  ipcMain.handle('tray:show-main', async () => {
    log.info('tray:show-main invoked')
    try {
      showMainWindow()
      log.debug('tray:show-main succeeded')
    } catch (error) {
      log.error('tray:show-main failed', error)
      throw error
    }
  })

  ipcMain.handle('tray:minimize-to-tray', async () => {
    log.info('tray:minimize-to-tray invoked')
    try {
      hideMainWindow()
      log.debug('tray:minimize-to-tray succeeded')
    } catch (error) {
      log.error('tray:minimize-to-tray failed', error)
      throw error
    }
  })
}

export { notifyTrayDataChanged }
