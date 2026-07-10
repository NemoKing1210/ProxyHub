import { DEFAULT_PROXY_COLOR_ID, PROXY_COLOR_IDS, type ProxyColorId } from '../types/proxy'

export function normalizeProxyColorId(value: string | undefined): ProxyColorId | undefined {
  if (!value?.trim()) {
    return undefined
  }

  return PROXY_COLOR_IDS.includes(value as ProxyColorId) ? (value as ProxyColorId) : undefined
}

export function resolveProxyColorId(color: string | ProxyColorId | undefined): ProxyColorId {
  return normalizeProxyColorId(color) ?? DEFAULT_PROXY_COLOR_ID
}
