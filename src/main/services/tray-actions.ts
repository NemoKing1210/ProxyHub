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
import { logger } from './logger'

const log = logger.scope('tray-actions')
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
  log.debug('Broadcast check-all state', { active })
  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) {
      window.webContents.send('proxy:check-all-state', active)
    }
  }
}

function notifyTrayDataChanged(): void {
  log.debug('Notifying tray data changed')
  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) {
      window.webContents.send('tray:proxies-updated')
    }
  }

  refreshTrayTooltip()
  void refreshTrayContextMenu().catch((error) => {
    log.error('Failed to refresh tray context menu after data change', error)
  })
}

async function persistProxyCheckResult(
  proxyId: string,
  result: Parameters<typeof applyCheckResult>[1],
  proxies: Proxy[]
): Promise<Proxy[]> {
  try {
    log.debug('Persisting proxy check result', { proxyId, status: result.status })
    const updated = proxies.map((proxy) =>
      proxy.id === proxyId ? applyCheckResult(proxy, result) : proxy
    )

    await saveProxies(updated)
    log.info('Proxy check result persisted', { proxyId })
    return updated
  } catch (error) {
    log.error('Failed to persist proxy check result', error)
    throw error
  }
}

async function runTrayCheckAll(proxies: Proxy[]): Promise<void> {
  log.info('runTrayCheckAll started', { total: proxies.length })
  const settings = await getSettings()
  const targets = filterEnabledProxies(proxies)
  const checkDomains = getEnabledCheckDomains(settings.checkDomains)

  if (targets.length === 0) {
    log.warn('runTrayCheckAll: no enabled proxies')
    return
  }

  const concurrency = settings.checkAllMode === 'parallel' ? settings.checkAllConcurrency : 1

  log.debug('runTrayCheckAll config', {
    targets: targets.length,
    checkDomains,
    concurrency,
    fetchExternalIp: settings.fetchExternalIp
  })
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
          log.info('Tray check completed for proxy', {
            proxyId: progress.result.id,
            status: progress.result.status
          })
          workingProxies = workingProxies.map((proxy) =>
            proxy.id === progress.result.id ? applyCheckResult(proxy, progress.result) : proxy
          )
        } else if (progress.phase === 'domain') {
          log.debug('Tray domain progress', {
            proxyId: progress.proxyId,
            domain: progress.domainCheck.domain,
            status: progress.domainCheck.status
          })
        }
      },
      settings.checkTimeoutMs,
      concurrency,
      signal,
      settings.domainCheckConcurrency,
      settings.fetchExternalIp
    )

    await saveProxies(workingProxies)
    log.info('runTrayCheckAll completed', { total: targets.length })
  } catch (error) {
    log.error('runTrayCheckAll failed', error)
    throw error
  } finally {
    throttledProgress.flush()
    clearCancellableCheck(signal)
    broadcastCheckAllState(false)
    notifyTrayDataChanged()
    log.debug('runTrayCheckAll cleanup done')
  }
}

export async function checkTrayProxyById(proxyId: string): Promise<void> {
  log.info('checkTrayProxyById called', { proxyId })
  if (checkingProxyIds.has(proxyId)) {
    log.warn('checkTrayProxyById: already checking', { proxyId })
    return
  }

  const proxies = await getProxies()
  const proxy = proxies.find((item) => item.id === proxyId)

  if (!proxy || proxy.isEnabled === false) {
    log.warn('checkTrayProxyById: proxy not found or disabled', { proxyId })
    return
  }

  const settings = await getSettings()
  const checkDomains = getEnabledCheckDomains(settings.checkDomains)

  checkingProxyIds.add(proxyId)
  void refreshTrayContextMenu()

  const signal = beginCancellableCheck()
  log.debug('checkTrayProxyById starting', { proxyId, checkDomains })

  try {
    const result = await checkProxy(
      proxy,
      checkDomains,
      settings.checkTimeoutMs,
      (progress) => {
        log.debug('Tray proxy check progress', { proxyId, phase: progress.phase })
        broadcastProgress(progress)
      },
      signal,
      settings.domainCheckConcurrency,
      settings.fetchExternalIp
    )
    log.info('checkTrayProxyById result', { proxyId, status: result.status })
    await persistProxyCheckResult(proxyId, result, proxies)
  } catch (error) {
    log.error('checkTrayProxyById failed', error)
    const failed = finalizeIncompleteProxy(proxy)
    const updated = proxies.map((item) => (item.id === proxyId ? failed : item))
    try {
      await saveProxies(updated)
    } catch (saveError) {
      log.error('Failed to save failed proxy state', saveError)
    }
    notifyTrayDataChanged()
  } finally {
    clearCancellableCheck(signal)
    checkingProxyIds.delete(proxyId)
    notifyTrayDataChanged()
    log.debug('checkTrayProxyById finished', { proxyId })
  }
}

export async function checkAllTrayProxies(): Promise<void> {
  log.info('checkAllTrayProxies triggered')
  try {
    await runTrayCheckAll(await getProxies())
  } catch (error) {
    log.error('checkAllTrayProxies failed', error)
    throw error
  }
}

export async function checkAllTrayFavorites(): Promise<void> {
  log.info('checkAllTrayFavorites triggered')
  try {
    const proxies = await getProxies()
    const favorites = proxies.filter((proxy) => proxy.isFavorite)
    log.debug('checkAllTrayFavorites', { favorites: favorites.length })
    await runTrayCheckAll(favorites)
  } catch (error) {
    log.error('checkAllTrayFavorites failed', error)
    throw error
  }
}

export { notifyTrayDataChanged }
