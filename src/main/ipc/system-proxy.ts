import { ipcMain } from 'electron'
import type { Proxy } from '@shared/types/proxy'
import { clearSystemProxy, getSystemProxy, setSystemProxy } from '../services/system-proxy'

export function registerSystemProxyIpc(): void {
  ipcMain.handle('system-proxy:get', async () => {
    return getSystemProxy()
  })

  ipcMain.handle('system-proxy:set', async (_event, proxy: Proxy) => {
    return setSystemProxy(proxy)
  })

  ipcMain.handle('system-proxy:clear', async () => {
    return clearSystemProxy()
  })
}
