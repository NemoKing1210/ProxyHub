import type { Proxy } from '@shared/types/proxy'
import { buildProxySearchHaystack } from './proxy-search-build'

const haystackCache = new Map<string, string>()

function getProxyHaystackVersion(proxy: Proxy): string {
  return [
    proxy.label,
    proxy.host,
    proxy.port,
    proxy.protocol,
    proxy.username,
    proxy.secret,
    proxy.countryCode,
    proxy.city,
    proxy.anonymityLevel,
    proxy.status,
    proxy.externalIp,
    proxy.connectivity?.externalIp,
    proxy.error,
    proxy.checkedAt
  ].join('|')
}

export function getProxySearchHaystack(proxy: Proxy): string {
  const version = getProxyHaystackVersion(proxy)
  const cached = haystackCache.get(proxy.id)

  if (cached?.startsWith(`${version}\u0000`)) {
    return cached.slice(version.length + 1)
  }

  const haystack = buildProxySearchHaystack(proxy)
  haystackCache.set(proxy.id, `${version}\u0000${haystack}`)
  return haystack
}

export function invalidateProxySearchHaystack(proxyId: string): void {
  haystackCache.delete(proxyId)
}

export function clearProxySearchHaystackCache(): void {
  haystackCache.clear()
}

export function pruneProxySearchHaystackCache(activeProxyIds: Set<string>): void {
  for (const proxyId of haystackCache.keys()) {
    if (!activeProxyIds.has(proxyId)) {
      haystackCache.delete(proxyId)
    }
  }
}
