import type { Proxy } from '../../../shared/types/proxy'
import {
  DEFAULT_PROXY_LIST_FILTERS,
  type ProxyFavoriteFilter,
  type ProxyListFilters,
  type ProxyStatusFilter
} from '../../../shared/types/proxy-list-view'
import {
  MAX_LATENCY_FILTER_DEFAULT_MS,
  MAX_LATENCY_FILTER_MAX_MS,
  MAX_LATENCY_FILTER_MIN_MS,
  MAX_LATENCY_FILTER_STEP_MS
} from '../../../shared/types/proxy-list-view.constants'
import { matchesProxySearch } from './proxy-search'

export type { ProxyFavoriteFilter, ProxyListFilters, ProxyStatusFilter }

export { DEFAULT_PROXY_LIST_FILTERS }

export {
  MAX_LATENCY_FILTER_DEFAULT_MS,
  MAX_LATENCY_FILTER_MAX_MS,
  MAX_LATENCY_FILTER_MIN_MS,
  MAX_LATENCY_FILTER_STEP_MS
}

export function getProxyDisplayLatency(proxy: Proxy): number | undefined {
  return (
    proxy.connectivity?.latencyMs ??
    proxy.latencyMs ??
    proxy.domainChecks?.find((check) => check.status === 'alive')?.latencyMs
  )
}

export function hasActiveFilters(filters: ProxyListFilters): boolean {
  return (
    filters.searchQuery.trim() !== '' ||
    filters.countryCode !== '' ||
    filters.city !== '' ||
    filters.protocol !== '' ||
    filters.anonymityLevel !== '' ||
    filters.favorite !== 'all' ||
    filters.status !== 'all' ||
    filters.maxLatencyMs !== null
  )
}

export function filterProxies(proxies: Proxy[], filters: ProxyListFilters): Proxy[] {
  return proxies.filter((proxy) => {
    if (filters.countryCode && proxy.countryCode !== filters.countryCode) {
      return false
    }

    if (filters.city && proxy.city?.toLowerCase() !== filters.city.toLowerCase()) {
      return false
    }

    if (filters.protocol && proxy.protocol !== filters.protocol) {
      return false
    }

    if (filters.anonymityLevel && proxy.anonymityLevel !== filters.anonymityLevel) {
      return false
    }

    if (filters.favorite === 'favorites' && !proxy.isFavorite) {
      return false
    }

    if (filters.favorite === 'nonFavorites' && proxy.isFavorite) {
      return false
    }

    if (filters.status === 'alive' && proxy.status !== 'alive') {
      return false
    }

    if (filters.status === 'dead' && proxy.status !== 'dead') {
      return false
    }

    if (filters.maxLatencyMs !== null) {
      const latency = getProxyDisplayLatency(proxy)
      if (latency === undefined || latency > filters.maxLatencyMs) {
        return false
      }
    }

    if (!matchesProxySearch(proxy, filters.searchQuery)) {
      return false
    }

    return true
  })
}
