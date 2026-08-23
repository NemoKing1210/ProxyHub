import { BrowserWindow, ipcMain, type WebContents } from 'electron'
import type { Proxy, ProxyCheckProgress } from '@shared/types/proxy'
import type { ProxyCheckOptions } from '@shared/types/settings'
import type { ProxyGroup } from '@shared/types/proxy-group'
import { createThrottledProgressEmitter } from '@shared/utils/proxy-progress-throttle'
import { getGroups, getProxies, saveGroups, saveProxies } from '../services/app-store'
import {
  beginCancellableCheck,
  cancelActiveCheck,
  clearCancellableCheck
} from '../services/check-cancellation'
import { checkAllProxies, checkProxy } from '../services/proxy-checker'
import { logger } from '../services/logger'
import { notifyTrayDataChanged } from './tray'
function sendProgress(webContents: WebContents, progress: ProxyCheckProgress): void {
  webContents.send('proxy:check-progress', progress)
}

function broadcastCheckAllState(active: boolean): void {
  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) {
      window.webContents.send('proxy:check-all-state', active)
    }
  }
}

export function registerProxyIpc(): void {
  const log = logger.scope('ipc:proxy')

  ipcMain.handle('proxy:get-all', async () => {
    log.info('proxy:get-all invoked')
    try {
      const result = await getProxies()
      log.debug('proxy:get-all succeeded', { count: result.length })
      return result
    } catch (error) {
      log.error('proxy:get-all failed', error)
      throw error
    }
  })

  ipcMain.handle('proxy:save-all', async (_event, proxies: Proxy[]) => {
    log.info('proxy:save-all invoked', { count: proxies.length })
    try {
      await saveProxies(proxies)
      notifyTrayDataChanged()
      log.debug('proxy:save-all succeeded', { count: proxies.length })
    } catch (error) {
      log.error('proxy:save-all failed', error)
      throw error
    }
  })

  ipcMain.handle('groups:get-all', async () => {
    log.info('groups:get-all invoked')
    try {
      const result = await getGroups()
      log.debug('groups:get-all succeeded', { count: result.length })
      return result
    } catch (error) {
      log.error('groups:get-all failed', error)
      throw error
    }
  })

  ipcMain.handle('groups:save-all', async (_event, groups: ProxyGroup[]) => {
    log.info('groups:save-all invoked', { count: groups.length })
    try {
      await saveGroups(groups)
      log.debug('groups:save-all succeeded', { count: groups.length })
    } catch (error) {
      log.error('groups:save-all failed', error)
      throw error
    }
  })

  ipcMain.handle('proxy:check', async (event, proxy: Proxy, options: ProxyCheckOptions) => {
    log.info('proxy:check invoked', {
      proxyId: proxy.id,
      host: proxy.host,
      checkDomains: options.checkDomains,
      checkTimeoutMs: options.checkTimeoutMs,
      fetchExternalIp: options.fetchExternalIp
    })
    const signal = beginCancellableCheck()

    try {
      const result = await checkProxy(
        proxy,
        options.checkDomains,
        options.checkTimeoutMs,
        (progress) => sendProgress(event.sender, progress),
        signal,
        options.domainCheckConcurrency,
        options.fetchExternalIp
      )
      log.debug('proxy:check succeeded', { proxyId: proxy.id })
      return result
    } catch (error) {
      log.error('proxy:check failed', error)
      throw error
    } finally {
      clearCancellableCheck(signal)
    }
  })

  ipcMain.handle('proxy:check-all', async (event, proxies: Proxy[], options: ProxyCheckOptions) => {
    log.info('proxy:check-all invoked', {
      count: proxies.length,
      checkDomains: options.checkDomains,
      checkAllConcurrency: options.checkAllConcurrency
    })
    const signal = beginCancellableCheck()
    broadcastCheckAllState(true)
    const throttledProgress = createThrottledProgressEmitter((progress) =>
      sendProgress(event.sender, progress)
    )

    try {
      await checkAllProxies(
        proxies,
        options.checkDomains,
        throttledProgress.emit,
        options.checkTimeoutMs,
        options.checkAllConcurrency,
        signal,
        options.domainCheckConcurrency,
        options.fetchExternalIp
      )
      log.debug('proxy:check-all succeeded', { count: proxies.length })
    } catch (error) {
      log.error('proxy:check-all failed', error)
      throw error
    } finally {
      throttledProgress.flush()
      clearCancellableCheck(signal)
      broadcastCheckAllState(false)
    }
  })

  ipcMain.handle('proxy:cancel-check-all', async () => {
    log.info('proxy:cancel-check-all invoked')
    try {
      cancelActiveCheck()
      log.debug('proxy:cancel-check-all succeeded')
    } catch (error) {
      log.error('proxy:cancel-check-all failed', error)
      throw error
    }
  })
}
