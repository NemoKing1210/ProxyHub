import http from 'http'
import https from 'https'
import { HttpProxyAgent } from 'http-proxy-agent'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { SocksProxyAgent } from 'socks-proxy-agent'
import type { Proxy, ProxyCheckErrorDetail, ProxyCheckResult } from '../../shared/types/proxy'
import { buildProxyUrl } from '../../shared/utils/proxy-format'

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

function getDomainFromUrl(checkUrl: string): string {
  return new URL(checkUrl).hostname
}

function buildSummaryError(failures: ProxyCheckErrorDetail[]): string {
  if (failures.length === 1) {
    return failures[0].message
  }

  return `All ${failures.length} check domains failed`
}

export async function checkProxy(
  proxy: Proxy,
  domains: string[],
  timeoutMs: number
): Promise<ProxyCheckResult> {
  const checkedAt = new Date().toISOString()
  const targets = domains.length > 0 ? domains : ['google.com']

  try {
    const agent = createAgent(proxy)
    const failures: ProxyCheckErrorDetail[] = []

    for (const domain of targets) {
      const checkUrl = normalizeDomain(domain)

      try {
        const result = await requestThroughProxy(agent, checkUrl, timeoutMs)

        return {
          id: proxy.id,
          status: 'alive',
          latencyMs: result.latencyMs,
          checkTarget: getDomainFromUrl(checkUrl),
          checkedAt
        }
      } catch (error) {
        failures.push(createErrorDetail(error, domain, checkUrl))
      }
    }

    return {
      id: proxy.id,
      status: 'dead',
      error: buildSummaryError(failures),
      errorDetails: failures,
      checkedAt
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    return {
      id: proxy.id,
      status: 'dead',
      error: message,
      errorDetails: [
        {
          domain: targets[0] ?? 'unknown',
          url: normalizeDomain(targets[0] ?? 'google.com'),
          message,
          code: getErrorCode(error)
        }
      ],
      checkedAt
    }
  }
}

export async function checkAllProxies(
  proxies: Proxy[],
  domains: string[],
  onProgress: (result: ProxyCheckResult) => void,
  timeoutMs: number,
  concurrency = DEFAULT_CONCURRENCY
): Promise<void> {
  let index = 0

  async function worker(): Promise<void> {
    while (index < proxies.length) {
      const currentIndex = index
      index += 1

      const proxy = proxies[currentIndex]
      const result = await checkProxy(proxy, domains, timeoutMs)
      onProgress(result)
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, proxies.length) }, () => worker())
  await Promise.all(workers)
}
