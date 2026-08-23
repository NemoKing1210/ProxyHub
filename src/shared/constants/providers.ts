import type { ProviderMeta } from '../types/provider'

export const PROVIDERS: ProviderMeta[] = [
  {
    id: 'proxyscrape',
    kind: 'builtin',
    name: 'ProxyScrape',
    description: 'Free proxy list from ProxyScrape — http, socks4, socks5 with filters.',
    url: 'https://proxyscrape.com/free-proxy-list',
    supportsFilters: true
  }
]
