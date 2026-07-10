import type { Proxy, ProxyCheckResult } from '../types/proxy'

export function applyCheckResult(proxy: Proxy, result: ProxyCheckResult): Proxy {
  return {
    ...proxy,
    status: result.status,
    latencyMs: result.latencyMs,
    externalIp: result.externalIp,
    checkTarget: result.checkTarget,
    error: result.error,
    errorDetails: result.errorDetails,
    domainChecks: result.domainChecks,
    connectivity: result.connectivity,
    checkedAt: result.checkedAt
  }
}
