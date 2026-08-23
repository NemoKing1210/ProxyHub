import { BrowserWindow } from 'electron'
import type { Proxy, ProxyCheckProgress } from '@shared/types/proxy'
import { getEnabledCheckDomains } from '@shared/types/settings'
import { createThrottledProgressEmitter } from '@shared/utils/proxy-progress-throttle'
import { applyCheckResult } from '@shared/utils/proxy-check-apply'
import { filterEnabledProxies } from '@shared/utils/proxy-enabled'
import { finalizeIncompleteProxy } from '@shared/utils/proxy-check-results'
import { getProxies, getSettings, saveProxies } from './app-store'
import { beginCancellableCheck, clearCancellableCheck } from './check-cancellation'
import { checkAllProxies, checkProxy } from './proxy-checker'
import { refreshTrayContextMenu, refreshTrayTooltip } from './tray'

const checkingProxyIds = new Set<string>()

export function isTrayProxyChecking(proxyId: string): boolean {
  return checkingProxyIds.has(proxyId)
}

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
  result: Parameters<typeof applyCheckResult>[1],
  proxies: Proxy[]
): Promise<Proxy[]> {
  const updated = proxies.map((proxy) =>
    proxy.id === proxyId ? applyCheckResult(proxy, result) : proxy
  )

  await saveProxies(updated)
  return updated
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

  const signal = beginCancellableCheck()
  let workingProxies = await getProxies()
  const throttledProgress = createThrottledProgressEmitter(broadcastProgress)

  try {
    await checkAllProxies(
      targets,
      checkDomains,
      (progress) => {
        throttledProgress.emit(progress)

        if (progress.phase === 'complete') {
          workingProxies = workingProxies.map((proxy) =>
            proxy.id === progress.result.id ? applyCheckResult(proxy, progress.result) : proxy
          )
        }
      },
      settings.checkTimeoutMs,
      concurrency,
      signal,
      settings.domainCheckConcurrency,
      settings.fetchExternalIp
    )

    await saveProxies(workingProxies)
  } finally {
    throttledProgress.flush()
    clearCancellableCheck(signal)
    broadcastCheckAllState(false)
    notifyTrayDataChanged()
  }
}

export async function checkTrayProxyById(proxyId: string): Promise<void> {
  if (checkingProxyIds.has(proxyId)) {
    return
  }

  const proxies = await getProxies()
  const proxy = proxies.find((item) => item.id === proxyId)

  if (!proxy || proxy.isEnabled === false) {
    return
  }

  const settings = await getSettings()
  const checkDomains = getEnabledCheckDomains(settings.checkDomains)

  checkingProxyIds.add(proxyId)
  void refreshTrayContextMenu()

  const signal = beginCancellableCheck()

  try {
    const result = await checkProxy(
      proxy,
      checkDomains,
      settings.checkTimeoutMs,
      broadcastProgress,
      signal,
      settings.domainCheckConcurrency,
      settings.fetchExternalIp
    )
    await persistProxyCheckResult(proxyId, result, proxies)
  } catch {
    const failed = finalizeIncompleteProxy(proxy)
    const updated = proxies.map((item) => (item.id === proxyId ? failed : item))
    await saveProxies(updated)
    notifyTrayDataChanged()
  } finally {
    clearCancellableCheck(signal)
    checkingProxyIds.delete(proxyId)
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
