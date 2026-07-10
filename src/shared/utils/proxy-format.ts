import type { Proxy } from '../types/proxy'

type ProxyLike = Pick<Proxy, 'protocol' | 'host' | 'port' | 'username' | 'password'>

export function buildProxyUrl(proxy: ProxyLike): string {
  const auth =
    proxy.username && proxy.password
      ? `${encodeURIComponent(proxy.username)}:${encodeURIComponent(proxy.password)}@`
      : ''

  return `${proxy.protocol}://${auth}${proxy.host}:${proxy.port}`
}

export function formatProxyAddress(proxy: Pick<Proxy, 'host' | 'port'>): string {
  return `${proxy.host}:${proxy.port}`
}
