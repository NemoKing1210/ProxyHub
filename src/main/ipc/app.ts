import { readFile } from 'fs/promises'
import { join } from 'path'
import { app, ipcMain } from 'electron'
import type { AppInfo } from '../../shared/types/app'
import { parseChangelog } from '../../shared/utils/changelog'

async function readAppInfo(): Promise<AppInfo> {
  const appPath = app.getAppPath()
  const [packageContent, changelogContent] = await Promise.all([
    readFile(join(appPath, 'package.json'), 'utf-8'),
    readFile(join(appPath, 'CHANGELOG.md'), 'utf-8')
  ])

  const { version } = JSON.parse(packageContent) as { version: string }

  return {
    version,
    changelog: parseChangelog(changelogContent)
  }
}

export function registerAppIpc(): void {
  ipcMain.handle('app:get-info', async () => readAppInfo())
}
