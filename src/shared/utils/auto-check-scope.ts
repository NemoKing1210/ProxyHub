import type { Proxy } from '../types/proxy'
import type { AutoCheckScope } from '../types/settings'
import { filterEnabledProxies } from './proxy-enabled'

export function resolveAutoCheckProxyIds(
  proxies: Proxy[],
  scope: AutoCheckScope,
  groupIds: string[]
): string[] {
  const enabled = filterEnabledProxies(proxies)

  switch (scope) {
    case 'favorites':
      return enabled.filter((proxy) => proxy.isFavorite).map((proxy) => proxy.id)
    case 'groups': {
      const groupSet = new Set(groupIds)
      return enabled
        .filter((proxy) => proxy.groupId && groupSet.has(proxy.groupId))
        .map((proxy) => proxy.id)
    }
    default:
      return enabled.map((proxy) => proxy.id)
  }
}
