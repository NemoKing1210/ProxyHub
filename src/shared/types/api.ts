import type { AppInfo } from './app'
import type { Proxy, ProxyCheckProgress, ProxyCheckResult } from './proxy'
import type { AppSettings, ProxyCheckOptions } from './settings'

export interface AppAPI {
  getProxies: () => Promise<Proxy[]>
  saveProxies: (proxies: Proxy[]) => Promise<void>
  checkProxy: (proxy: Proxy, options: ProxyCheckOptions) => Promise<ProxyCheckResult>
  checkAll: (proxies: Proxy[], options: ProxyCheckOptions) => Promise<void>
  onCheckProgress: (callback: (progress: ProxyCheckProgress) => void) => () => void
  getSettings: () => Promise<AppSettings>
  saveSettings: (settings: AppSettings) => Promise<void>
  getAppInfo: () => Promise<AppInfo>
}
