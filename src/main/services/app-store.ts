import { app } from 'electron'
import { logger } from './logger'
import type { ProxyGroup } from '@shared/types/proxy-group'
import type { Proxy } from '@shared/types/proxy'
import { DEFAULT_SETTINGS, normalizeSettings, type AppSettings } from '@shared/types/settings'
import type { SyncConfig, SyncStatus } from '@shared/types/sync'
import {
  DEFAULT_SYNC_CONFIG,
  DEFAULT_SYNC_STATUS,
  normalizeSyncConfig,
  normalizeSyncStatus
} from '@shared/utils/sync-config'

interface StoreSchema {
  proxies: Proxy[]
  groups: ProxyGroup[]
  settings: AppSettings
  sync: SyncConfig
  syncStatus: SyncStatus
}

interface StoreInstance {
  get: <K extends keyof StoreSchema>(key: K) => StoreSchema[K]
  set: <K extends keyof StoreSchema>(key: K, value: StoreSchema[K]) => void
}

const baseStoreOptions = {
  name: 'proxyhub',
  clearInvalidConfig: false,
  defaults: {
    proxies: [] as Proxy[],
    groups: [] as ProxyGroup[],
    settings: DEFAULT_SETTINGS,
    sync: DEFAULT_SYNC_CONFIG,
    syncStatus: DEFAULT_SYNC_STATUS
  }
} as const

let storePromise: Promise<StoreInstance> | null = null

const log = logger.scope('app-store')

async function getStore(): Promise<StoreInstance> {
  if (!storePromise) {
    log.info('Initializing app store')
    storePromise = import('electron-store')
      .then(({ default: Store }) => {
        const cwd = (() => {
          try {
            return app.getPath('userData')
          } catch {
            return undefined
          }
        })()

        const instance = new Store<StoreSchema>({
          ...baseStoreOptions,
          ...(cwd ? { cwd } : {})
        })
        log.info('App store initialized', { cwd: cwd ?? 'default' })
        return instance
      })
      .catch((error) => {
        log.error('Failed to initialize app store', error)
        storePromise = null
        throw error
      })
  } else {
    log.debug('getStore cache hit')
  }

  try {
    return await storePromise
  } catch (error) {
    log.error('getStore failed', error)
    throw error
  }
}

export async function getProxies(): Promise<Proxy[]> {
  try {
    const proxies = (await getStore()).get('proxies')
    log.debug('getProxies', { count: proxies.length })
    return proxies
  } catch (error) {
    log.error('Failed to get proxies', error)
    throw error
  }
}

export async function saveProxies(proxies: Proxy[]): Promise<void> {
  try {
    log.debug('Saving proxies', { count: proxies.length })
    ;(await getStore()).set('proxies', proxies)
    log.info('Proxies saved', { count: proxies.length })
  } catch (error) {
    log.error('Failed to save proxies', error)
    throw error
  }
}

export async function getGroups(): Promise<ProxyGroup[]> {
  try {
    const groups = (await getStore()).get('groups')
    log.debug('getGroups', { count: groups.length })
    return groups
  } catch (error) {
    log.error('Failed to get groups', error)
    throw error
  }
}

export async function saveGroups(groups: ProxyGroup[]): Promise<void> {
  try {
    log.debug('Saving groups', { count: groups.length })
    ;(await getStore()).set('groups', groups)
    log.info('Groups saved', { count: groups.length })
  } catch (error) {
    log.error('Failed to save groups', error)
    throw error
  }
}

export async function getSettings(): Promise<AppSettings> {
  try {
    const settings = (await getStore()).get('settings')
    log.debug('getSettings', { theme: settings.theme, language: settings.language })
    return settings
  } catch (error) {
    log.error('Failed to get settings', error)
    throw error
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    const normalized = normalizeSettings(settings)
    log.debug('Saving settings', { language: normalized.language, theme: normalized.theme })
    ;(await getStore()).set('settings', normalized)
    log.info('Settings saved')
  } catch (error) {
    log.error('Failed to save settings', error)
    throw error
  }
}

export async function getSyncConfig(): Promise<SyncConfig> {
  try {
    const sync = (await getStore()).get('sync')
    log.debug('getSyncConfig', { provider: sync.provider, scope: sync.scope })
    return sync
  } catch (error) {
    log.error('Failed to get sync config', error)
    throw error
  }
}

export async function saveSyncConfig(sync: SyncConfig): Promise<void> {
  try {
    const normalized = normalizeSyncConfig(sync)
    log.debug('Saving sync config', { provider: normalized.provider, scope: normalized.scope })
  } catch (error) {
    log.error('Failed to save sync config', error)
    throw error
  }
}

export async function getSyncStatus(): Promise<SyncStatus> {
  try {
    const status = (await getStore()).get('syncStatus')
    log.debug('getSyncStatus', { lastPushAt: status.lastPushAt, lastPullAt: status.lastPullAt })
    return status
  } catch (error) {
    log.error('Failed to get sync status', error)
    throw error
  }
}

export async function saveSyncStatus(syncStatus: SyncStatus): Promise<void> {
  try {
    const normalized = normalizeSyncStatus(syncStatus)
    log.debug('Saving sync status', {
      lastPushAt: normalized.lastPushAt,
      lastError: normalized.lastError?.code
    })
    ;(await getStore()).set('syncStatus', normalized)
    log.info('Sync status saved')
  } catch (error) {
    log.error('Failed to save sync status', error)
    throw error
  }
}
