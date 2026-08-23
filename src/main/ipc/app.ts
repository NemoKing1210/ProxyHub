import { readFile } from 'fs/promises'
import { join } from 'path'
import { app, BrowserWindow, ipcMain, shell } from 'electron'
import type { AppInfo } from '@shared/types/app'
import type { ThemeMode } from '@shared/types/settings'
import { parseChangelog } from '@shared/utils/changelog'
import { parsePackageAuthor } from '@shared/utils/package-author'
import { resolveGitHubUsername } from '@shared/utils/github'
import { syncTitleBarTheme } from '../services/title-bar'
import { showNativeNotification } from '../services/notifications'
import { isMainWindowBackgrounded } from '../services/main-window'
import { logger } from '../services/logger'
import type { AppNotificationPayload } from '@shared/types/api'
interface PackageJson {
  version: string
  author?: string | { name?: string; email?: string }
  homepage?: string
  repository?: string | { type?: string; url: string }
}

function resolveRepositoryUrl(pkg: PackageJson): string | undefined {
  if (typeof pkg.repository === 'string') {
    return pkg.repository.replace(/\.git$/, '')
  }

  if (pkg.repository?.url) {
    return pkg.repository.url.replace(/^git\+/, '').replace(/\.git$/, '')
  }

  return pkg.homepage
}

async function readAppInfo(): Promise<AppInfo> {
  const appPath = app.getAppPath()
  const [packageContent, changelogContent] = await Promise.all([
    readFile(join(appPath, 'package.json'), 'utf-8'),
    readFile(join(appPath, 'CHANGELOG.md'), 'utf-8')
  ])

  const packageJson = JSON.parse(packageContent) as PackageJson
  const repositoryUrl = resolveRepositoryUrl(packageJson)
  const { name: author, email: authorEmail } = parsePackageAuthor(packageJson.author)
  const githubUsername = resolveGitHubUsername(repositoryUrl, author)

  return {
    version: packageJson.version,
    author,
    authorEmail:
      authorEmail ?? (githubUsername ? `${githubUsername}@users.noreply.github.com` : undefined),
    repositoryUrl,
    changelog: parseChangelog(changelogContent)
  }
}

export function registerAppIpc(): void {
  const log = logger.scope('ipc:app')

  ipcMain.handle('app:get-info', async () => {
    log.info('app:get-info invoked')
    try {
      const result = await readAppInfo()
      log.debug('app:get-info succeeded', { version: result.version })
      return result
    } catch (error) {
      log.error('app:get-info failed', error)
      throw error
    }
  })
  ipcMain.handle('app:open-external', async (_event, url: string) => {
    log.info('app:open-external invoked', { url })
    try {
      await shell.openExternal(url)
      log.debug('app:open-external succeeded', { url })
    } catch (error) {
      log.error('app:open-external failed', error)
      throw error
    }
  })
  ipcMain.handle('app:set-title-bar-theme', async (_event, mode: ThemeMode) => {
    log.info('app:set-title-bar-theme invoked', { mode })
    try {
      const window = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]

      if (!window) {
        log.debug('app:set-title-bar-theme no window')
        return
      }

      syncTitleBarTheme(window, mode)
      log.debug('app:set-title-bar-theme succeeded', { mode })
    } catch (error) {
      log.error('app:set-title-bar-theme failed', error)
      throw error
    }
  })
  ipcMain.handle('window:minimize', (event) => {
    log.info('window:minimize invoked')
    try {
      BrowserWindow.fromWebContents(event.sender)?.minimize()
      log.debug('window:minimize succeeded')
    } catch (error) {
      log.error('window:minimize failed', error)
      throw error
    }
  })
  ipcMain.handle('window:toggle-maximize', (event) => {
    log.info('window:toggle-maximize invoked')
    try {
      const window = BrowserWindow.fromWebContents(event.sender)

      if (!window) {
        log.debug('window:toggle-maximize no window')
        return false
      }

      if (window.isMaximized()) {
        window.unmaximize()
      } else {
        window.maximize()
      }

      const maximized = window.isMaximized()
      log.debug('window:toggle-maximize succeeded', { maximized })
      return maximized
    } catch (error) {
      log.error('window:toggle-maximize failed', error)
      throw error
    }
  })
  ipcMain.handle('window:close', (event) => {
    log.info('window:close invoked')
    try {
      BrowserWindow.fromWebContents(event.sender)?.close()
      log.debug('window:close succeeded')
    } catch (error) {
      log.error('window:close failed', error)
      throw error
    }
  })
  ipcMain.handle('window:get-maximized', (event) => {
    log.info('window:get-maximized invoked')
    try {
      const result = BrowserWindow.fromWebContents(event.sender)?.isMaximized() ?? false
      log.debug('window:get-maximized succeeded', { result })
      return result
    } catch (error) {
      log.error('window:get-maximized failed', error)
      throw error
    }
  })
  ipcMain.handle('app:is-backgrounded', async () => {
    log.info('app:is-backgrounded invoked')
    try {
      const result = await isMainWindowBackgrounded()
      log.debug('app:is-backgrounded succeeded', { result })
      return result
    } catch (error) {
      log.error('app:is-backgrounded failed', error)
      throw error
    }
  })
  ipcMain.handle('app:show-notification', async (_event, payload: AppNotificationPayload) => {
    log.info('app:show-notification invoked', { title: payload.title })
    try {
      const result = showNativeNotification(payload)
      log.debug('app:show-notification succeeded')
      return result
    } catch (error) {
      log.error('app:show-notification failed', error)
      throw error
    }
  })
}
