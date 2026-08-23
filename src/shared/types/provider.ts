import type { Proxy } from './proxy'

export type ProviderId = 'proxyscrape' | (string & {})

export type ProviderKind = 'builtin' | 'custom'

export interface ProviderMeta {
  id: ProviderId
  kind: ProviderKind
  name: string
  description: string
  url: string
  icon?: string
  supportsFilters?: boolean
}

export interface ProviderFetchParams {
  protocol?: 'http' | 'socks4' | 'socks5' | 'all'
  country?: string
  timeoutMs?: number
  limit?: number
}

export interface ProviderProxy extends Proxy {
  providerId: ProviderId
  providerMeta?: {
    anonymity?: string
    timeout?: number
    ssl?: boolean
  }
}

export interface ProviderFetchResult {
  proxies: ProviderProxy[]
  total?: number
  fetchedAt: string
}

export interface ProviderError {
  code: 'network_error' | 'rate_limited' | 'parse_error' | 'unknown'
  message: string
}
