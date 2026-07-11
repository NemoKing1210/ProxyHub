import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { TITLE_BAR_HEIGHT } from '../shared/theme/title-bar'
import { registerAppIpc } from './ipc/app'
import { registerBackupIpc } from './ipc/backup'
import { registerProxyImportIpc } from './ipc/proxy-import'
import { registerProxyIpc } from './ipc/proxy'
import { registerSettingsIpc } from './ipc/settings'
import { registerSyncIpc, runStartupSyncPull } from './ipc/sync'
import { registerTrayIpc, syncTrayEnabled } from './ipc/tray'
import { registerUpdaterIpc } from './ipc/updater'
import { initializeAutoUpdater, scheduleStartupUpdateCheck } from './services/auto-updater'
import { syncLaunchAtLoginFromSettings } from './services/auto-launch'
import { getSettings } from './services/app-store'
import { getMainWindow, setMainWindow, showMainWindow } from './services/main-window'
import { isAppQuitting, isTrayEnabled, setAppQuitting } from './services/tray-state'
import {
  applyTitleBarThemeFromSettings,
  initializeNativeThemeListener,
  resolveTitleBarTheme
} from './services/title-bar'

async function createWindow(): Promise<void> {
  const settings = await getSettings()
  const initialTitleBarTheme = resolveTitleBarTheme(settings.theme)

  const mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: initialTitleBarTheme.color,
    ...(process.platform === 'win32'
      ? {
          titleBarStyle: 'hidden',
          titleBarOverlay: {
            color: initialTitleBarTheme.color,
            symbolColor: initialTitleBarTheme.symbolColor,
            height: TITLE_BAR_HEIGHT
          }
        }
      : {}),
    ...(process.platform !== 'darwin' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  setMainWindow(mainWindow)
  applyTitleBarThemeFromSettings(mainWindow, settings.theme)

  mainWindow.on('ready-to-show', () => {
    if (settings.trayEnabled && settings.startMinimized) {
      return
    }

    mainWindow.show()
  })

  mainWindow.on('close', (event) => {
    if (!isTrayEnabled() || isAppQuitting()) {
      return
    }

    event.preventDefault()
    mainWindow.hide()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.on('before-quit', () => {
  setAppQuitting(true)
})

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.nemoking1210.proxychecker')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerProxyIpc()
  registerSettingsIpc()
  registerBackupIpc()
  registerProxyImportIpc()
  registerSyncIpc()
  registerAppIpc()
  registerUpdaterIpc()
  registerTrayIpc()
  initializeNativeThemeListener(() => getMainWindow() ?? undefined)

  const settings = await getSettings()
  syncLaunchAtLoginFromSettings(settings)
  await syncTrayEnabled(settings.trayEnabled)
  await runStartupSyncPull()
  await createWindow()
  initializeAutoUpdater()
  scheduleStartupUpdateCheck()

  app.on('activate', function () {
    if (getMainWindow()) {
      showMainWindow()
      return
    }

    if (BrowserWindow.getAllWindows().length === 0) {
      void createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (isTrayEnabled()) {
    return
  }

  if (process.platform !== 'darwin') {
    app.quit()
  }
})
