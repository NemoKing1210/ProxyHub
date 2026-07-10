import type { ProxyGroup } from '../../shared/types/proxy-group'
import type { Proxy } from '../../shared/types/proxy'
import { DEFAULT_SETTINGS, normalizeSettings, type AppSettings } from '../../shared/types/settings'

interface StoreSchema {
  proxies: Proxy[]
  groups: ProxyGroup[]
  settings: AppSettings
}

interface StoreInstance {
  get: <K extends keyof StoreSchema>(key: K) => StoreSchema[K]
  set: <K extends keyof StoreSchema>(key: K, value: StoreSchema[K]) => void
}

const storeOptions = {
  name: 'proxy-checker',
  defaults: {
    proxies: [] as Proxy[],
    groups: [] as ProxyGroup[],
    settings: DEFAULT_SETTINGS
  }
}

let storePromise: Promise<StoreInstance> | null = null

async function getStore(): Promise<StoreInstance> {
  if (!storePromise) {
    storePromise = import('electron-store').then(({ default: Store }) => {
      return new Store<StoreSchema>(storeOptions)
    })
  }

  return storePromise
}

export async function getProxies(): Promise<Proxy[]> {
  return (await getStore()).get('proxies')
}

export async function saveProxies(proxies: Proxy[]): Promise<void> {
  ;(await getStore()).set('proxies', proxies)
}

export async function getGroups(): Promise<ProxyGroup[]> {
  return (await getStore()).get('groups')
}

export async function saveGroups(groups: ProxyGroup[]): Promise<void> {
  ;(await getStore()).set('groups', groups)
}

export async function getSettings(): Promise<AppSettings> {
  const settings = (await getStore()).get('settings')
  return normalizeSettings(settings)
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  ;(await getStore()).set('settings', normalizeSettings(settings))
}
