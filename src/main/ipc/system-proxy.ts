import { ipcMain } from 'electron'
import type { Proxy } from '@shared/types/proxy'
import { clearSystemProxy, getSystemProxy, setSystemProxy } from '../services/system-proxy'
import { logger } from '../services/logger'

export function registerSystemProxyIpc(): void {
  const log = logger.scope('ipc:system-proxy')

  ipcMain.handle('system-proxy:get', async () => {
    log.info('system-proxy:get invoked')
    try {
      const result = await getSystemProxy()
      log.debug('system-proxy:get succeeded', { hasProxy: !!result })
      return result
    } catch (error) {
      log.error('system-proxy:get failed', error)
      throw error
    }
  })

  ipcMain.handle('system-proxy:set', async (_event, proxy: Proxy) => {
    log.info('system-proxy:set invoked', { proxyId: proxy.id, host: proxy.host })
    try {
      const result = await setSystemProxy(proxy)
      log.debug('system-proxy:set succeeded', { proxyId: proxy.id })
      return result
    } catch (error) {
      log.error('system-proxy:set failed', error)
      throw error
    }
  })

  ipcMain.handle('system-proxy:clear', async () => {
    log.info('system-proxy:clear invoked')
    try {
      const result = await clearSystemProxy()
      log.debug('system-proxy:clear succeeded')
      return result
    } catch (error) {
      log.error('system-proxy:clear failed', error)
      throw error
    }
  })
}
