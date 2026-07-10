import type { Proxy } from '../types/proxy'

export function getFavoriteProxies(proxies: Proxy[]): Proxy[] {
  return proxies
    .filter((proxy) => proxy.isFavorite)
    .sort((a, b) => {
      const nameA = (a.label?.trim() || a.host).toLowerCase()
      const nameB = (b.label?.trim() || b.host).toLowerCase()
      return nameA.localeCompare(nameB)
    })
}

export function getProxyDisplayName(proxy: Proxy): string {
  return proxy.label?.trim() || `${proxy.host}:${proxy.port}`
}
