import { ipcMain, type WebContents } from 'electron'
import type { Proxy, ProxyCheckResult } from '../../shared/types/proxy'
import { getProxies, getSettings, saveProxies } from '../services/app-store'
import { checkAllProxies, checkProxy } from '../services/proxy-checker'

function sendProgress(webContents: WebContents, result: ProxyCheckResult): void {
  webContents.send('proxy:check-progress', result)
}

export function registerProxyIpc(): void {
  ipcMain.handle('proxy:get-all', async () => getProxies())

  ipcMain.handle('proxy:save-all', async (_event, proxies: Proxy[]) => {
    await saveProxies(proxies)
  })

  ipcMain.handle('proxy:check', async (_event, proxy: Proxy) => {
    const settings = await getSettings()
    return checkProxy(proxy, settings.checkDomains)
  })

  ipcMain.handle('proxy:check-all', async (event, proxies: Proxy[]) => {
    const settings = await getSettings()
    await checkAllProxies(proxies, settings.checkDomains, (result) =>
      sendProgress(event.sender, result)
    )
  })
}
