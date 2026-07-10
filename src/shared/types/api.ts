import type { ThemeMode } from '../types/settings'
import type { AppInfo } from './app'
import type { Proxy, ProxyCheckProgress, ProxyCheckResult } from './proxy'
import type { AppSettings, ProxyCheckOptions } from './settings'

export interface AppNotificationPayload {
  title: string
  body?: string
}

export interface AppAPI {
  getProxies: () => Promise<Proxy[]>
  saveProxies: (proxies: Proxy[]) => Promise<void>
  checkProxy: (proxy: Proxy, options: ProxyCheckOptions) => Promise<ProxyCheckResult>
  checkAll: (proxies: Proxy[], options: ProxyCheckOptions) => Promise<void>
  onCheckProgress: (callback: (progress: ProxyCheckProgress) => void) => () => void
  getSettings: () => Promise<AppSettings>
  saveSettings: (settings: AppSettings) => Promise<void>
  getAppInfo: () => Promise<AppInfo>
  openExternal: (url: string) => Promise<void>
  setTitleBarTheme: (mode: ThemeMode) => Promise<void>
  showMainWindow: () => Promise<void>
  isMainWindowBackgrounded: () => Promise<boolean>
  showNotification: (payload: AppNotificationPayload) => Promise<boolean>
  onTrayProxiesUpdated: (callback: () => void) => () => void
  onOpenProxyFromTray: (callback: (proxyId: string) => void) => () => void
  onCheckAllState: (callback: (active: boolean) => void) => () => void
}
