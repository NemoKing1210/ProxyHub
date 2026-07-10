import { ipcMain, type WebContents } from 'electron'
import type { Proxy, ProxyCheckProgress } from '../../shared/types/proxy'
import { getProxies, getSettings, saveProxies } from '../services/app-store'
import { checkAllProxies, checkProxy } from '../services/proxy-checker'

function sendProgress(webContents: WebContents, progress: ProxyCheckProgress): void {
  webContents.send('proxy:check-progress', progress)
}

export function registerProxyIpc(): void {
  ipcMain.handle('proxy:get-all', async () => getProxies())

  ipcMain.handle('proxy:save-all', async (_event, proxies: Proxy[]) => {
    await saveProxies(proxies)
  })

  ipcMain.handle('proxy:check', async (event, proxy: Proxy) => {
    const settings = await getSettings()
    return checkProxy(
      proxy,
      settings.checkDomains,
      settings.checkTimeoutMs,
      (progress) => sendProgress(event.sender, progress)
    )
  })

  ipcMain.handle('proxy:check-all', async (event, proxies: Proxy[]) => {
    const settings = await getSettings()
    await checkAllProxies(
      proxies,
      settings.checkDomains,
      (progress) => sendProgress(event.sender, progress),
      settings.checkTimeoutMs
    )
  })
}
