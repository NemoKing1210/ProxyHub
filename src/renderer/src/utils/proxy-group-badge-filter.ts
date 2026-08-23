import type { Proxy } from '@shared/types/proxy'
import { isProxyEnabled } from '@shared/utils/proxy-enabled'

export type ProxyGroupBadgeFilter = 'alive' | 'dead' | 'enabled' | 'favorites'

export function filterProxiesByGroupBadge(
  proxies: Proxy[],
  filter: ProxyGroupBadgeFilter | null
): Proxy[] {
  if (!filter) {
    return proxies
  }

  switch (filter) {
    case 'alive':
      return proxies.filter((proxy) => proxy.status === 'alive')
    case 'dead':
      return proxies.filter((proxy) => proxy.status === 'dead')
    case 'enabled':
      return proxies.filter(isProxyEnabled)
    case 'favorites':
      return proxies.filter((proxy) => proxy.isFavorite)
  }
}

export function toggleProxyGroupBadgeFilter(
  current: ProxyGroupBadgeFilter | null,
  key: string
): ProxyGroupBadgeFilter | null {
  if (key === 'total') {
    return null
  }

  if (key === 'alive' || key === 'dead' || key === 'enabled' || key === 'favorites') {
    return current === key ? null : key
  }

  return current
}

export function isProxyGroupBadgeFilterActive(
  filter: ProxyGroupBadgeFilter | null,
  key: string
): boolean {
  if (key === 'total') {
    return filter === null
  }

  return filter === key
}
