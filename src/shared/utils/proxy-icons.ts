import { DEFAULT_PROXY_ICON_ID, PROXY_ICON_IDS, type ProxyIconId } from '../types/proxy'

export function normalizeProxyIconId(value: string | undefined): ProxyIconId | undefined {
  if (!value?.trim()) {
    return undefined
  }

  return PROXY_ICON_IDS.includes(value as ProxyIconId) ? (value as ProxyIconId) : undefined
}

export function resolveProxyIconId(icon: string | ProxyIconId | undefined): ProxyIconId {
  return normalizeProxyIconId(icon) ?? DEFAULT_PROXY_ICON_ID
}
