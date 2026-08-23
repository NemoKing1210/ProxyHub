import { ipcMain } from 'electron'
import type { ProviderFetchParams, ProviderId } from '@shared/types/provider'
import { fetchProviderProxies, listProviders } from '../services/providers/provider-registry'
import { logger } from '../services/logger'

export function registerProviderIpc(): void {
  const log = logger.scope('ipc:provider')

  ipcMain.handle('provider:list', async () => {
    log.info('provider:list invoked')
    try {
      const result = await listProviders()
      log.debug('provider:list succeeded', { count: result.length })
      return result
    } catch (error) {
      log.error('provider:list failed', error)
      throw error
    }
  })

  ipcMain.handle(
    'provider:fetch-proxies',
    async (_event, providerId: ProviderId, params?: ProviderFetchParams) => {
      log.info('provider:fetch-proxies invoked', { providerId, hasParams: !!params })
      try {
        const result = await fetchProviderProxies(providerId, params)
        log.debug('provider:fetch-proxies succeeded', { providerId })
        return result
      } catch (error) {
        log.error('provider:fetch-proxies failed', error)
        throw error
      }
    }
  )
}
