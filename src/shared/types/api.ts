import type { Proxy, ProxyCheckResult } from './proxy'
import type { AppSettings } from './settings'

export interface AppAPI {
  getProxies: () => Promise<Proxy[]>
  saveProxies: (proxies: Proxy[]) => Promise<void>
  checkProxy: (proxy: Proxy) => Promise<ProxyCheckResult>
  checkAll: (proxies: Proxy[]) => Promise<void>
  onCheckProgress: (callback: (result: ProxyCheckResult) => void) => () => void
  getSettings: () => Promise<AppSettings>
  saveSettings: (settings: AppSettings) => Promise<void>
}
