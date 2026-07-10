import type {
  Proxy,
  ProxyConnectivityResult,
  ProxyDomainCheckResult,
  ProxyStatus
} from '../types/proxy'
import { buildProxyUrl, formatProxyAddress } from './proxy-format'

export function normalizeCheckDomain(domain: string): string {
  const trimmed = domain
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
  return `https://${trimmed}`
}

export function createPendingDomainChecks(domains: string[]): ProxyDomainCheckResult[] {
  return domains.map((domain) => ({
    domain,
    url: normalizeCheckDomain(domain),
    status: 'pending'
  }))
}

export function createCheckingConnectivity(proxy: Proxy): ProxyConnectivityResult {
  return {
    address: formatProxyAddress(proxy),
    protocol: proxy.protocol,
    proxyUrl: buildProxyUrl(proxy),
    status: 'checking'
  }
}

export function upsertDomainCheck(
  checks: ProxyDomainCheckResult[],
  update: ProxyDomainCheckResult
): ProxyDomainCheckResult[] {
  const index = checks.findIndex((check) => check.domain === update.domain)

  if (index === -1) {
    return [...checks, update]
  }

  const next = [...checks]
  next[index] = update
  return next
}

export function resolveProxyStatusFromDomainChecks(
  domainChecks: ProxyDomainCheckResult[] | undefined
): ProxyStatus {
  if (!domainChecks || domainChecks.length === 0) {
    return 'checking'
  }

  const hasPending = domainChecks.some(
    (check) => check.status === 'pending' || check.status === 'checking'
  )

  if (hasPending) {
    return 'checking'
  }

  return domainChecks.some((check) => check.status === 'alive') ? 'alive' : 'dead'
}

export function resolveProxyStatus(
  domainChecks: ProxyDomainCheckResult[] | undefined,
  connectivity: ProxyConnectivityResult | undefined
): ProxyStatus {
  if (domainChecks && domainChecks.length > 0) {
    return resolveProxyStatusFromDomainChecks(domainChecks)
  }

  if (!connectivity) {
    return 'checking'
  }

  if (connectivity.status === 'pending' || connectivity.status === 'checking') {
    return 'checking'
  }

  return connectivity.status === 'alive' ? 'alive' : 'dead'
}

export function finalizeIncompleteProxy(proxy: Proxy): Proxy {
  if (proxy.status !== 'checking') {
    return proxy
  }

  const connectivity =
    proxy.connectivity?.status === 'pending' || proxy.connectivity?.status === 'checking'
      ? {
          ...proxy.connectivity,
          status: 'dead' as const,
          error: proxy.connectivity.error ?? 'Check did not complete'
        }
      : proxy.connectivity

  if (!proxy.domainChecks || proxy.domainChecks.length === 0) {
    const status = resolveProxyStatus([], connectivity)

    return {
      ...proxy,
      connectivity,
      status: status === 'checking' ? 'unknown' : status,
      error: status === 'dead' ? (connectivity?.error ?? proxy.error) : proxy.error,
      latencyMs: status === 'alive' ? connectivity?.latencyMs : proxy.latencyMs,
      checkedAt: proxy.checkedAt ?? new Date().toISOString()
    }
  }

  const domainChecks = proxy.domainChecks.map((check) =>
    check.status === 'pending' || check.status === 'checking'
      ? {
          ...check,
          status: 'dead' as const,
          error: check.error ?? 'Check did not complete'
        }
      : check
  )

  const deadChecks = domainChecks.filter((check) => check.status === 'dead')
  const hasAlive = domainChecks.some((check) => check.status === 'alive')

  return {
    ...proxy,
    domainChecks,
    connectivity,
    status: hasAlive ? 'alive' : 'dead',
    error: hasAlive
      ? proxy.error
      : deadChecks.length === 1
        ? deadChecks[0].error
        : (proxy.error ?? `All ${deadChecks.length} check domains failed`),
    checkedAt: proxy.checkedAt ?? new Date().toISOString()
  }
}

export function getProxyDomainChecks(proxy: Proxy): ProxyDomainCheckResult[] {
  if (proxy.domainChecks !== undefined) {
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
        url: normalizeCheckDomain(proxy.checkTarget),
        status: 'alive',
        latencyMs: proxy.latencyMs
      }
    ]
  }

  return []
}
