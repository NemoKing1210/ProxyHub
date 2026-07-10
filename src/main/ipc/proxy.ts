import { ipcMain, type WebContents } from 'electron'
import type { Proxy, ProxyCheckProgress } from '../../shared/types/proxy'
import type { ProxyCheckOptions } from '../../shared/types/settings'
import { getProxies, saveProxies } from '../services/app-store'
import { checkAllProxies, checkProxy } from '../services/proxy-checker'
import { notifyTrayDataChanged } from './tray'

function sendProgress(webContents: WebContents, progress: ProxyCheckProgress): void {
  webContents.send('proxy:check-progress', progress)
}

export function registerProxyIpc(): void {
  ipcMain.handle('proxy:get-all', async () => getProxies())

  ipcMain.handle('proxy:save-all', async (_event, proxies: Proxy[]) => {
    await saveProxies(proxies)
    notifyTrayDataChanged()
  })

  ipcMain.handle('proxy:check', async (event, proxy: Proxy, options: ProxyCheckOptions) => {
    return checkProxy(proxy, options.checkDomains, options.checkTimeoutMs, (progress) =>
      sendProgress(event.sender, progress)
    )
  })

  ipcMain.handle(
    'proxy:check-all',
    async (event, proxies: Proxy[], options: ProxyCheckOptions) => {
      await checkAllProxies(
        proxies,
        options.checkDomains,
        (progress) => sendProgress(event.sender, progress),
        options.checkTimeoutMs,
        options.checkAllConcurrency
      )
    }
  )
}
