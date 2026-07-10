import { BrowserWindow } from 'electron'
import type { Proxy, ProxyCheckProgress } from '../../shared/types/proxy'
import { getEnabledCheckDomains } from '../../shared/types/settings'
import { applyCheckResult } from '../../shared/utils/proxy-check-apply'
import { filterEnabledProxies } from '../../shared/utils/proxy-enabled'
import { finalizeIncompleteProxy } from '../../shared/utils/proxy-check-results'
import { getProxies, getSettings, saveProxies } from './app-store'
import { checkAllProxies, checkProxy } from './proxy-checker'
import { refreshTrayContextMenu, refreshTrayTooltip } from './tray'

function broadcastProgress(progress: ProxyCheckProgress): void {
  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) {
      window.webContents.send('proxy:check-progress', progress)
    }
  }
}

function broadcastCheckAllState(active: boolean): void {
  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) {
      window.webContents.send('proxy:check-all-state', active)
    }
  }
}

function notifyTrayDataChanged(): void {
  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) {
      window.webContents.send('tray:proxies-updated')
    }
  }

  refreshTrayTooltip()
  void refreshTrayContextMenu()
}

async function persistProxyCheckResult(
  proxyId: string,
  result: Parameters<typeof applyCheckResult>[1]
): Promise<void> {
  const proxies = await getProxies()
  const updated = proxies.map((proxy) =>
    proxy.id === proxyId ? applyCheckResult(proxy, result) : proxy
  )

  await saveProxies(updated)
  notifyTrayDataChanged()
}

async function runTrayCheckAll(proxies: Proxy[]): Promise<void> {
  const settings = await getSettings()
  const targets = filterEnabledProxies(proxies)
  const checkDomains = getEnabledCheckDomains(settings.checkDomains)

  if (targets.length === 0) {
    return
  }

  const concurrency = settings.checkAllMode === 'parallel' ? settings.checkAllConcurrency : 1

  broadcastCheckAllState(true)

  try {
    await checkAllProxies(
      targets,
      checkDomains,
      (progress) => {
        broadcastProgress(progress)

        if (progress.phase === 'complete') {
          void persistProxyCheckResult(progress.result.id, progress.result)
        }
      },
      settings.checkTimeoutMs,
      concurrency
    )
  } finally {
    broadcastCheckAllState(false)
    notifyTrayDataChanged()
  }
}

export async function checkTrayProxyById(proxyId: string): Promise<void> {
  const proxies = await getProxies()
  const proxy = proxies.find((item) => item.id === proxyId)

  if (!proxy) {
    return
  }

  const settings = await getSettings()
  const checkDomains = getEnabledCheckDomains(settings.checkDomains)

  try {
    const result = await checkProxy(proxy, checkDomains, settings.checkTimeoutMs, broadcastProgress)
    await persistProxyCheckResult(proxyId, result)
  } catch {
    const failed = finalizeIncompleteProxy(proxy)
    const updated = proxies.map((item) => (item.id === proxyId ? failed : item))
    await saveProxies(updated)
    notifyTrayDataChanged()
  }
}

export async function checkAllTrayProxies(): Promise<void> {
  await runTrayCheckAll(await getProxies())
}

export async function checkAllTrayFavorites(): Promise<void> {
  const proxies = await getProxies()
  await runTrayCheckAll(proxies.filter((proxy) => proxy.isFavorite))
}

export { notifyTrayDataChanged }
