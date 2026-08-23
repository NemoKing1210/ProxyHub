import type { Proxy } from '@shared/types/proxy'
import { getProxySearchHaystack } from './proxy-search-cache'

export { buildProxySearchHaystack } from './proxy-search-build'

export function matchesProxySearch(proxy: Proxy, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) {
    return true
  }

  return getProxySearchHaystack(proxy).includes(normalizedQuery)
}
