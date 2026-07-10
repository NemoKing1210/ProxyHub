import http from 'http'
import https from 'https'
import { HttpProxyAgent } from 'http-proxy-agent'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { SocksProxyAgent } from 'socks-proxy-agent'
import type {
  Proxy,
  ProxyCheckErrorDetail,
  ProxyCheckProgress,
  ProxyCheckResult,
  ProxyDomainCheckResult
} from '../../shared/types/proxy'
import { buildProxyUrl } from '../../shared/utils/proxy-format'
import { createPendingDomainChecks } from '../../shared/utils/proxy-check-results'

const DEFAULT_CONCURRENCY = 20

function createAgent(proxy: Proxy): http.Agent {
  const proxyUrl = buildProxyUrl(proxy)

  if (proxy.protocol === 'socks4' || proxy.protocol === 'socks5') {
    return new SocksProxyAgent(proxyUrl)
  }

  if (proxy.protocol === 'https') {
    return new HttpsProxyAgent(proxyUrl)
  }

  return new HttpProxyAgent(proxyUrl)
}

function normalizeDomain(domain: string): string {
  const trimmed = domain.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
  return `https://${trimmed}`
}

function getErrorCode(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code?: unknown }).code
    return typeof code === 'string' ? code : undefined
  }

  return undefined
}

function createErrorDetail(
  error: unknown,
  domain: string,
  checkUrl: string
): ProxyCheckErrorDetail {
  const message = error instanceof Error ? error.message : 'Unknown error'

  return {
    domain,
    url: checkUrl,
    message,
    code: getErrorCode(error)
  }
}

function requestThroughProxy(
  agent: http.Agent,
  checkUrl: string,
  timeoutMs: number
): Promise<{ latencyMs: number }> {
  return new Promise((resolve, reject) => {
    const start = Date.now()

    const request = https.get(
      checkUrl,
      {
        agent,
        timeout: timeoutMs
      },
      (response) => {
        response.resume()

        if (response.statusCode && response.statusCode >= 400) {
          reject(new Error(`HTTP ${response.statusCode}`))
          return
        }

        resolve({ latencyMs: Date.now() - start })
      }
    )

    request.on('timeout', () => {
      request.destroy()
      reject(new Error('Connection timeout'))
    })

    request.on('error', (error) => {
      reject(error)
    })
  })
}

function buildSummaryError(failures: ProxyCheckErrorDetail[]): string {
  if (failures.length === 1) {
    return failures[0].message
  }

  return `All ${failures.length} check domains failed`
}

function toErrorDetails(checks: ProxyDomainCheckResult[]): ProxyCheckErrorDetail[] {
  return checks
    .filter((check) => check.status === 'dead')
    .map((check) => ({
      domain: check.domain,
      url: check.url,
      message: check.error ?? 'Unknown error',
      code: check.code
    }))
}

function buildAgentFailureChecks(
  targets: string[],
  message: string,
  code?: string
): ProxyDomainCheckResult[] {
  return targets.map((domain) => ({
    domain,
    url: normalizeDomain(domain),
    status: 'dead',
    error: message,
    code
  }))
}

function emitDomainProgress(
  onProgress: ((progress: ProxyCheckProgress) => void) | undefined,
  proxyId: string,
  domainCheck: ProxyDomainCheckResult
): void {
  onProgress?.({ phase: 'domain', proxyId, domainCheck })
}

export async function checkProxy(
  proxy: Proxy,
  domains: string[],
  timeoutMs: number,
  onProgress?: (progress: ProxyCheckProgress) => void
): Promise<ProxyCheckResult> {
  const targets = domains.length > 0 ? domains : ['google.com']
  const checkedAt = new Date().toISOString()
  const pendingChecks = createPendingDomainChecks(targets)

  onProgress?.({ phase: 'init', proxyId: proxy.id, domainChecks: pendingChecks })

  try {
    const agent = createAgent(proxy)
    const domainChecks: ProxyDomainCheckResult[] = []

    for (const domain of targets) {
      const checkUrl = normalizeDomain(domain)

      emitDomainProgress(onProgress, proxy.id, {
        domain,
        url: checkUrl,
        status: 'checking'
      })

      try {
        const result = await requestThroughProxy(agent, checkUrl, timeoutMs)
        const completed: ProxyDomainCheckResult = {
          domain,
          url: checkUrl,
          status: 'alive',
          latencyMs: result.latencyMs
        }

        domainChecks.push(completed)
        emitDomainProgress(onProgress, proxy.id, completed)
      } catch (error) {
        const detail = createErrorDetail(error, domain, checkUrl)
        const completed: ProxyDomainCheckResult = {
          domain,
          url: checkUrl,
          status: 'dead',
          error: detail.message,
          code: detail.code
        }

        domainChecks.push(completed)
        emitDomainProgress(onProgress, proxy.id, completed)
      }
    }

    const aliveChecks = domainChecks.filter((check) => check.status === 'alive')
    const failures = toErrorDetails(domainChecks)

    const finalResult: ProxyCheckResult =
      aliveChecks.length > 0
        ? (() => {
            const bestCheck = aliveChecks.reduce((best, current) =>
              (current.latencyMs ?? Number.POSITIVE_INFINITY) <
              (best.latencyMs ?? Number.POSITIVE_INFINITY)
                ? current
                : best
            )

            return {
              id: proxy.id,
              status: 'alive',
              latencyMs: bestCheck.latencyMs,
              checkTarget: bestCheck.domain,
              domainChecks,
              errorDetails: failures.length > 0 ? failures : undefined,
              checkedAt
            }
          })()
        : {
            id: proxy.id,
            status: 'dead',
            error: buildSummaryError(failures),
            errorDetails: failures,
            domainChecks,
            checkedAt
          }

    onProgress?.({ phase: 'complete', result: finalResult })
    return finalResult
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const code = getErrorCode(error)
    const failedChecks = buildAgentFailureChecks(targets, message, code)

    for (const domainCheck of failedChecks) {
      emitDomainProgress(onProgress, proxy.id, domainCheck)
    }

    const failures = toErrorDetails(failedChecks)
    const finalResult: ProxyCheckResult = {
      id: proxy.id,
      status: 'dead',
      error: message,
      errorDetails: failures,
      domainChecks: failedChecks,
      checkedAt
    }

    onProgress?.({ phase: 'complete', result: finalResult })
    return finalResult
  }
}

export async function checkAllProxies(
  proxies: Proxy[],
  domains: string[],
  onProgress: (progress: ProxyCheckProgress) => void,
  timeoutMs: number,
  concurrency = DEFAULT_CONCURRENCY
): Promise<void> {
  let index = 0

  async function worker(): Promise<void> {
    while (index < proxies.length) {
      const currentIndex = index
      index += 1

      const proxy = proxies[currentIndex]
      await checkProxy(proxy, domains, timeoutMs, onProgress)
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, proxies.length) }, () => worker())
  await Promise.all(workers)
}
