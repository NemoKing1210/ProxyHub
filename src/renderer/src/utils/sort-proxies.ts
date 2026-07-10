import type { Proxy } from '../../../shared/types/proxy'

export function sortProxiesByFavorite(proxies: Proxy[]): Proxy[] {
  return [...proxies].sort((a, b) => Number(Boolean(b.isFavorite)) - Number(Boolean(a.isFavorite)))
}
