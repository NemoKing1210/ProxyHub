import { BrowserWindow, ipcMain, type WebContents } from 'electron'
import type { Proxy, ProxyCheckProgress } from '../../shared/types/proxy'
import type { ProxyCheckOptions } from '../../shared/types/settings'
import type { ProxyGroup } from '../../shared/types/proxy-group'
import { createThrottledProgressEmitter } from '../../shared/utils/proxy-progress-throttle'
import { getGroups, getProxies, saveGroups, saveProxies } from '../services/app-store'
import {
  beginCancellableCheck,
  cancelActiveCheck,
  clearCancellableCheck
} from '../services/check-cancellation'
import { checkAllProxies, checkProxy } from '../services/proxy-checker'
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
  ipcMain.handle('proxy:get-all', async () => getProxies())

  ipcMain.handle('proxy:save-all', async (_event, proxies: Proxy[]) => {
    await saveProxies(proxies)
    notifyTrayDataChanged()
  })

  ipcMain.handle('groups:get-all', async () => getGroups())

  ipcMain.handle('groups:save-all', async (_event, groups: ProxyGroup[]) => {
    await saveGroups(groups)
  })

  ipcMain.handle('proxy:check', async (event, proxy: Proxy, options: ProxyCheckOptions) => {
    const signal = beginCancellableCheck()

    try {
      return await checkProxy(
        proxy,
        options.checkDomains,
        options.checkTimeoutMs,
        (progress) => sendProgress(event.sender, progress),
        signal,
        options.domainCheckConcurrency,
        options.fetchExternalIp
      )
    } finally {
      clearCancellableCheck(signal)
    }
  })

  ipcMain.handle('proxy:check-all', async (event, proxies: Proxy[], options: ProxyCheckOptions) => {
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
    } finally {
      throttledProgress.flush()
      clearCancellableCheck(signal)
      broadcastCheckAllState(false)
    }
  })

  ipcMain.handle('proxy:cancel-check-all', async () => {
    cancelActiveCheck()
  })
}
