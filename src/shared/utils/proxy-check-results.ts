import type { Proxy, ProxyDomainCheckResult } from '../types/proxy'

export function getProxyDomainChecks(proxy: Proxy): ProxyDomainCheckResult[] {
  if (proxy.domainChecks && proxy.domainChecks.length > 0) {
    return proxy.domainChecks
  }

  if (proxy.errorDetails && proxy.errorDetails.length > 0) {
    return proxy.errorDetails.map((detail) => ({
      domain: detail.domain,
      url: detail.url,
      status: 'dead',
      error: detail.message,
      code: detail.code
    }))
  }

  if (proxy.checkTarget && proxy.status === 'alive') {
    return [
      {
        domain: proxy.checkTarget,
        url: `https://${proxy.checkTarget}`,
        status: 'alive',
        latencyMs: proxy.latencyMs
      }
    ]
  }

  return []
}
