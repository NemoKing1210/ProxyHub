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
  ipcMain.handle('app:get-info', async () => readAppInfo())
  ipcMain.handle('app:open-external', async (_event, url: string) => {
    await shell.openExternal(url)
  })
  ipcMain.handle('app:set-title-bar-theme', async (_event, mode: ThemeMode) => {
    const window = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]

    if (!window) {
      return
    }

    syncTitleBarTheme(window, mode)
  })
  ipcMain.handle('window:minimize', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize()
  })
  ipcMain.handle('window:toggle-maximize', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)

    if (!window) {
      return false
    }

    if (window.isMaximized()) {
      window.unmaximize()
    } else {
      window.maximize()
    }

    return window.isMaximized()
  })
  ipcMain.handle('window:close', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close()
  })
  ipcMain.handle('window:get-maximized', (event) => {
    return BrowserWindow.fromWebContents(event.sender)?.isMaximized() ?? false
  })
  ipcMain.handle('app:is-backgrounded', async () => isMainWindowBackgrounded())
  ipcMain.handle('app:show-notification', async (_event, payload: AppNotificationPayload) => {
    return showNativeNotification(payload)
  })
}
