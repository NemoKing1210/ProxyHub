import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { registerAppIpc } from './ipc/app'
import { registerBackupIpc } from './ipc/backup'
import { registerLoggerIpc } from './ipc/logger'
import { registerProviderIpc } from './ipc/provider'
import { registerProxyImportIpc } from './ipc/proxy-import'
import { registerProxyIpc } from './ipc/proxy'
import { registerSettingsIpc } from './ipc/settings'
import { registerSyncIpc, runStartupSyncPull } from './ipc/sync'
import { registerSystemProxyIpc } from './ipc/system-proxy'
import { registerTrayIpc, syncTrayEnabled } from './ipc/tray'
import { registerUpdaterIpc } from './ipc/updater'
import { initializeAutoUpdater, scheduleStartupUpdateCheck } from './services/auto-updater'
import { syncLaunchAtLoginFromSettings } from './services/auto-launch'
import { getSettings } from './services/app-store'
import { getMainWindow, setMainWindow, showMainWindow } from './services/main-window'
import { isAppQuitting, isTrayEnabled, setAppQuitting } from './services/tray-state'
import { initLogger, logger } from './services/logger'
import {
  applyTitleBarThemeFromSettings,
  initializeNativeThemeListener,
  resolveTitleBarTheme
} from './services/title-bar'

async function createWindow(): Promise<void> {
  const log = logger.scope('app')
  log.info('createWindow invoked')
  try {
    const settings = await getSettings()
    const initialTitleBarTheme = resolveTitleBarTheme(settings.theme)

    log.debug('createWindow creating BrowserWindow', { theme: settings.theme })
    const mainWindow = new BrowserWindow({
      width: 1100,
      height: 720,
      show: false,
      autoHideMenuBar: true,
      backgroundColor: initialTitleBarTheme.color,
      ...(process.platform === 'win32'
        ? {
            frame: false
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
      log.info('window ready-to-show')
      if (settings.trayEnabled && settings.startMinimized) {
        log.debug('window ready-to-show suppressed (startMinimized)')
        return
      }

      log.debug('window showing')
      mainWindow.show()
    })

    const notifyMaximizedState = (): void => {
      const isMaximized = mainWindow.isMaximized()
      log.debug('window maximized-changed', { isMaximized })
      mainWindow.webContents.send('window:maximized-changed', isMaximized)
    }

    mainWindow.on('maximize', notifyMaximizedState)
    mainWindow.on('unmaximize', notifyMaximizedState)

    mainWindow.on('close', (event) => {
      if (!isTrayEnabled() || isAppQuitting()) {
        log.info('window close proceeding to quit', {
          trayEnabled: isTrayEnabled(),
          isAppQuitting: isAppQuitting()
        })
        return
      }

      log.info('window close intercepted, hiding to tray (background)')
      event.preventDefault()
      mainWindow.hide()
    })

    mainWindow.webContents.setWindowOpenHandler((details) => {
      log.info('window open-external', { url: details.url })
      shell.openExternal(details.url)
      return { action: 'deny' }
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      log.debug('window loading URL', { url: process.env['ELECTRON_RENDERER_URL'] })
      mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
      log.debug('window loading file', { file: join(__dirname, '../renderer/index.html') })
      mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }
    log.info('createWindow succeeded')
  } catch (error) {
    logger.scope('app').error('createWindow failed', error)
    throw error
  }
}

app.on('before-quit', () => {
  logger.scope('app').info('before-quit', { isAppQuitting: true })
  setAppQuitting(true)
})
app.whenReady().then(async () => {
  const log = logger.scope('app')
  log.info('app whenReady')

  electronApp.setAppUserModelId('com.nemoking1210.proxyhub')
  log.debug('setAppUserModelId succeeded')

  app.on('browser-window-created', (_, window) => {
    log.info('browser-window-created', { id: window.id })
    optimizer.watchWindowShortcuts(window)
    log.debug('watchWindowShortcuts registered', { id: window.id })
  })

  log.info('registering IPC handlers')
  registerProxyIpc()
  registerProviderIpc()
  registerSettingsIpc()
  registerBackupIpc()
  registerProxyImportIpc()
  registerSyncIpc()
  registerAppIpc()
  registerUpdaterIpc()
  registerTrayIpc()
  registerSystemProxyIpc()
  registerLoggerIpc()
  log.debug('IPC handlers registered')
  initializeNativeThemeListener(() => getMainWindow() ?? undefined)
  log.debug('native theme listener initialized')

  log.info('initLogger starting')
  await initLogger()
  logger.scope('app').info('Main process starting')
  log.debug('initLogger succeeded')

  const settings = await getSettings()
  log.info('settings loaded', { trayEnabled: settings.trayEnabled })
  syncLaunchAtLoginFromSettings(settings)
  log.debug('syncLaunchAtLoginFromSettings completed')
  log.info('syncTray starting', { trayEnabled: settings.trayEnabled })
  await syncTrayEnabled(settings.trayEnabled)
  log.debug('syncTray completed')
  log.info('startup sync pull starting')
  try {
    await runStartupSyncPull()
    log.info('startup sync pull succeeded')
  } catch (error) {
    log.error('startup sync pull failed', error)
  }
  log.info('createWindow starting')
  await createWindow()
  log.debug('createWindow completed')
  initializeAutoUpdater()
  log.debug('auto updater initialized')
  scheduleStartupUpdateCheck()
  log.debug('startup update check scheduled')

  app.on('activate', function () {
    log.info('app activate')
    if (getMainWindow()) {
      log.debug('activate showing main window')
      showMainWindow()
      return
    }

    if (BrowserWindow.getAllWindows().length === 0) {
      log.info('activate createWindow (no windows)')
      void createWindow().catch((error) => log.error('activate createWindow failed', error))
    }
  })
})

app.on('window-all-closed', () => {
  const log = logger.scope('app')
  log.info('window-all-closed', { trayEnabled: isTrayEnabled(), platform: process.platform })
  if (isTrayEnabled()) {
    log.debug('window-all-closed kept alive (tray enabled)')
    return
  }

  if (process.platform !== 'darwin') {
    log.info('window-all-closed quitting app')
    app.quit()
  }
})
