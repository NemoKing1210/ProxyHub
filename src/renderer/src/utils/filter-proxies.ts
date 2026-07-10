import type { Proxy, ProxyAnonymityLevel } from '../../../shared/types/proxy'

export type ProxyFavoriteFilter = 'all' | 'favorites' | 'nonFavorites'

export type ProxyStatusFilter = 'all' | 'alive' | 'dead'

export interface ProxyListFilters {
  countryCode: string
  city: string
  anonymityLevel: ProxyAnonymityLevel | ''
  favorite: ProxyFavoriteFilter
  status: ProxyStatusFilter
  maxLatencyMs: number | null
}

export const DEFAULT_PROXY_LIST_FILTERS: ProxyListFilters = {
  countryCode: '',
  city: '',
  anonymityLevel: '',
  favorite: 'all',
  status: 'all',
  maxLatencyMs: null
}

export const MAX_LATENCY_FILTER_MIN_MS = 50
export const MAX_LATENCY_FILTER_MAX_MS = 2000
export const MAX_LATENCY_FILTER_DEFAULT_MS = 300
export const MAX_LATENCY_FILTER_STEP_MS = 50

export function getProxyDisplayLatency(proxy: Proxy): number | undefined {
  return (
    proxy.connectivity?.latencyMs ??
    proxy.latencyMs ??
    proxy.domainChecks?.find((check) => check.status === 'alive')?.latencyMs
  )
}

export function hasActiveFilters(filters: ProxyListFilters): boolean {
  return (
    filters.countryCode !== '' ||
    filters.city !== '' ||
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

    return true
  })
}
