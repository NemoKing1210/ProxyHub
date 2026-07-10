import type { Proxy, ProxyDomainCheckResult, ProxyStatus } from '../types/proxy'

export function normalizeCheckDomain(domain: string): string {
  const trimmed = domain.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
  return `https://${trimmed}`
}

export function createPendingDomainChecks(domains: string[]): ProxyDomainCheckResult[] {
  const targets = domains.length > 0 ? domains : ['google.com']

  return targets.map((domain) => ({
    domain,
    url: normalizeCheckDomain(domain),
    status: 'pending'
  }))
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

export function finalizeIncompleteProxy(proxy: Proxy): Proxy {
  if (proxy.status !== 'checking') {
    return proxy
  }

  if (!proxy.domainChecks || proxy.domainChecks.length === 0) {
    return { ...proxy, status: 'unknown' }
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
    status: hasAlive ? 'alive' : 'dead',
    error: hasAlive
      ? proxy.error
      : deadChecks.length === 1
        ? deadChecks[0].error
        : proxy.error ?? `All ${deadChecks.length} check domains failed`,
    checkedAt: proxy.checkedAt ?? new Date().toISOString()
  }
}

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
        url: normalizeCheckDomain(proxy.checkTarget),
        status: 'alive',
        latencyMs: proxy.latencyMs
      }
    ]
  }

  return []
}
