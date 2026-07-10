import type { Proxy } from '../types/proxy'

export function isProxyEnabled(proxy: Proxy): boolean {
  return proxy.isEnabled !== false
}

export function filterEnabledProxies(proxies: Proxy[]): Proxy[] {
  return proxies.filter(isProxyEnabled)
}
