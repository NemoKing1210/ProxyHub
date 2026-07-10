import { findProxyCountry } from '../../../shared/constants/proxy-countries'
import type { Proxy } from '../../../shared/types/proxy'
import { buildProxyUrl } from '../../../shared/utils/proxy-format'

export function buildProxySearchHaystack(proxy: Proxy): string {
  const country = proxy.countryCode ? findProxyCountry(proxy.countryCode) : undefined

  const parts = [
    proxy.label,
    proxy.host,
    String(proxy.port),
    `${proxy.host}:${proxy.port}`,
    proxy.protocol,
    proxy.username,
    proxy.countryCode,
    country?.name,
    proxy.city,
    proxy.anonymityLevel,
    proxy.status,
    proxy.externalIp,
    proxy.connectivity?.externalIp,
    proxy.error,
    buildProxyUrl(proxy)
  ]

  return parts
    .filter((part): part is string => Boolean(part?.trim()))
    .join(' ')
    .toLowerCase()
}

export function matchesProxySearch(proxy: Proxy, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) {
    return true
  }

  return buildProxySearchHaystack(proxy).includes(normalizedQuery)
}
