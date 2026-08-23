import { PROVIDERS } from '@shared/constants/providers'
import type { ProviderFetchParams, ProviderFetchResult, ProviderMeta } from '@shared/types/provider'
import type { ProviderId } from '@shared/types/provider'
import { fetchProxyScrapeProxies } from './proxyscrape'

export function listProviders(): ProviderMeta[] {
  return PROVIDERS
}

export async function fetchProviderProxies(
  id: ProviderId,
  params: ProviderFetchParams = {},
  signal?: AbortSignal
): Promise<ProviderFetchResult> {
  if (id === 'proxyscrape') {
    return fetchProxyScrapeProxies(params, signal)
  }

  throw { code: 'unknown', message: `Unknown provider ${id}` }
}
