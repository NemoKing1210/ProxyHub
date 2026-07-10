import { ipcMain } from 'electron'
import { createTray, destroyTray, refreshTrayContextMenu, refreshTrayTooltip } from '../services/tray'
import { notifyTrayDataChanged } from '../services/tray-actions'
import { hideMainWindow, showMainWindow } from '../services/main-window'
import { setTrayEnabledState } from '../services/tray-state'

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
  ipcMain.handle('tray:show-main', async () => {
    showMainWindow()
  })

  ipcMain.handle('tray:minimize-to-tray', async () => {
    hideMainWindow()
  })
}

export { notifyTrayDataChanged }
