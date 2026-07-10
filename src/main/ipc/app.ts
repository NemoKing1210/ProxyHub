import { readFile } from 'fs/promises'
import { join } from 'path'
import { app, ipcMain, shell } from 'electron'
import type { AppInfo } from '../../shared/types/app'
import { parseChangelog } from '../../shared/utils/changelog'
import { parsePackageAuthor } from '../../shared/utils/package-author'
import { resolveGitHubUsername } from '../../shared/utils/github'

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
    authorEmail: authorEmail ?? (githubUsername ? `${githubUsername}@users.noreply.github.com` : undefined),
    repositoryUrl,
    changelog: parseChangelog(changelogContent)
  }
}

export function registerAppIpc(): void {
  ipcMain.handle('app:get-info', async () => readAppInfo())
  ipcMain.handle('app:open-external', async (_event, url: string) => {
    await shell.openExternal(url)
  })
}
