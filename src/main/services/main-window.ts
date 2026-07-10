import { BrowserWindow } from 'electron'

let mainWindow: BrowserWindow | null = null

export function setMainWindow(window: BrowserWindow): void {
  mainWindow = window
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}

export function showMainWindow(): void {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return
  }

  if (mainWindow.isMinimized()) {
    mainWindow.restore()
  }

  mainWindow.show()
  mainWindow.focus()
}

export function hideMainWindow(): void {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return
  }

  mainWindow.hide()
}

export function openProxyFromTray(proxyId: string): void {
  showMainWindow()

  if (!mainWindow || mainWindow.isDestroyed()) {
    return
  }

  mainWindow.webContents.send('tray:open-proxy', proxyId)
}

