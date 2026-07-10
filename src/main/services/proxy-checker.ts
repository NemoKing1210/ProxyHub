import http from 'http'
import https from 'https'
import net from 'net'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { SocksProxyAgent } from 'socks-proxy-agent'
import type {
  Proxy,
  ProxyCheckErrorDetail,
  ProxyCheckProgress,
  ProxyCheckResult,
  ProxyConnectivityResult,
  ProxyDomainCheckResult
} from '../../shared/types/proxy'
import { buildProxyUrl, formatProxyAddress } from '../../shared/utils/proxy-format'
import {
  createCheckingConnectivity,
  createPendingDomainChecks
} from '../../shared/utils/proxy-check-results'

const DEFAULT_CONCURRENCY = 1
const EXTERNAL_IP_URL = 'https://api.ipify.org?format=json'

const PROXY_CHECK_HEADERS: Readonly<Record<string, string>> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Accept: '*/*',
  'Accept-Language': 'en-US,en;q=0.9',
  Connection: 'close'
}

function createAgent(proxy: Proxy): http.Agent {
  const proxyUrl = buildProxyUrl(proxy)

  if (proxy.protocol === 'socks4' || proxy.protocol === 'socks5') {
    return new SocksProxyAgent(proxyUrl)
  }

  return new HttpsProxyAgent(proxyUrl)
}

function createHttpsRequestOptions(
  agent: http.Agent,
  timeoutMs: number,
  method: 'GET' | 'HEAD' = 'GET'
): https.RequestOptions {
  return {
    agent,
    timeout: timeoutMs,
    method,
    headers: { ...PROXY_CHECK_HEADERS }
  }
}

function normalizeDomain(domain: string): string {
  const trimmed = domain
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
  return `https://${trimmed}`
}

function getErrorCode(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code?: unknown }).code
    return typeof code === 'string' ? code : undefined
  }

  return undefined
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error'
}

function createErrorDetail(
  error: unknown,
  domain: string,
  checkUrl: string
): ProxyCheckErrorDetail {
  const message = getErrorMessage(error)

  return {
    domain,
    url: checkUrl,
    message,
    code: getErrorCode(error)
  }
}

function createConnectivityBase(proxy: Proxy): Pick<
  ProxyConnectivityResult,
  'address' | 'protocol' | 'proxyUrl'
> {
  return {
    address: formatProxyAddress(proxy),
    protocol: proxy.protocol,
    proxyUrl: buildProxyUrl(proxy)
  }
}

function testTcpConnection(
  host: string,
  port: number,
  timeoutMs: number
): Promise<{ latencyMs: number }> {
  return new Promise((resolve, reject) => {
    const start = Date.now()
    const socket = net.createConnection({ host, port })

    const cleanup = (): void => {
      socket.removeAllListeners()
      socket.destroy()
    }

    const timer = setTimeout(() => {
      cleanup()
      reject(new Error('Connection timeout'))
    }, timeoutMs)

    socket.once('connect', () => {
      clearTimeout(timer)
      const latencyMs = Date.now() - start
      cleanup()
      resolve({ latencyMs })
    })

    socket.once('error', (error) => {
      clearTimeout(timer)
      cleanup()
      reject(error)
    })
  })
}

function requestThroughProxy(
  agent: http.Agent,
  checkUrl: string,
  timeoutMs: number
): Promise<{ latencyMs: number }> {
  return new Promise((resolve, reject) => {
    const start = Date.now()

    const request = https.request(
      checkUrl,
      createHttpsRequestOptions(agent, timeoutMs, 'HEAD'),
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

    request.end()
  })
}

function fetchExternalIp(agent: http.Agent, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = https.get(
      EXTERNAL_IP_URL,
      createHttpsRequestOptions(agent, timeoutMs),
      (response) => {
        let body = ''

        response.on('data', (chunk: Buffer | string) => {
          body += chunk.toString()
        })

        response.on('end', () => {
          if (response.statusCode && response.statusCode >= 400) {
            reject(new Error(`HTTP ${response.statusCode}`))
            return
          }

          try {
            const parsed = JSON.parse(body) as { ip?: string }

            if (!parsed.ip) {
              reject(new Error('Invalid IP response'))
              return
            }

            resolve(parsed.ip)
          } catch {
            reject(new Error('Failed to parse IP response'))
          }
        })
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

function emitConnectivityProgress(
  onProgress: ((progress: ProxyCheckProgress) => void) | undefined,
  proxyId: string,
  connectivity: ProxyConnectivityResult
): void {
  onProgress?.({ phase: 'proxy-connect', proxyId, connectivity })
}

async function checkProxyConnectivity(
  proxy: Proxy,
  timeoutMs: number,
  onProgress?: (progress: ProxyCheckProgress) => void
): Promise<ProxyConnectivityResult> {
  const base = createConnectivityBase(proxy)

  emitConnectivityProgress(onProgress, proxy.id, {
    ...base,
    status: 'checking'
  })

  try {
    const result = await testTcpConnection(proxy.host, proxy.port, timeoutMs)
    const connectivity: ProxyConnectivityResult = {
      ...base,
      status: 'alive',
      latencyMs: result.latencyMs
    }

    emitConnectivityProgress(onProgress, proxy.id, connectivity)
    return connectivity
  } catch (error) {
    const connectivity: ProxyConnectivityResult = {
      ...base,
      status: 'dead',
      error: getErrorMessage(error),
      code: getErrorCode(error)
    }

    emitConnectivityProgress(onProgress, proxy.id, connectivity)
    return connectivity
  }
}

async function resolveExternalIp(
  agent: http.Agent,
  timeoutMs: number,
  connectivity: ProxyConnectivityResult,
  hasAliveDomain: boolean
): Promise<ProxyConnectivityResult> {
  if (connectivity.status !== 'alive' && !hasAliveDomain) {
    return connectivity
  }

  try {
    const externalIp = await fetchExternalIp(agent, timeoutMs)
    return { ...connectivity, externalIp }
  } catch {
    return connectivity
  }
}

export async function checkProxy(
  proxy: Proxy,
  domains: string[],
  timeoutMs: number,
  onProgress?: (progress: ProxyCheckProgress) => void
): Promise<ProxyCheckResult> {
  const targets = domains
  const checkedAt = new Date().toISOString()
  const pendingChecks = createPendingDomainChecks(targets)
  const initialConnectivity = createCheckingConnectivity(proxy)

  onProgress?.({
    phase: 'init',
    proxyId: proxy.id,
    domainChecks: pendingChecks,
    connectivity: initialConnectivity
  })

  let connectivity = await checkProxyConnectivity(proxy, timeoutMs, onProgress)

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
    const hasAliveDomain = aliveChecks.length > 0
    const hasDomains = targets.length > 0
    const connectivityAlive = connectivity.status === 'alive'

    connectivity = await resolveExternalIp(
      agent,
      timeoutMs,
      connectivity,
      hasAliveDomain || (!hasDomains && connectivityAlive)
    )

    if (connectivity.externalIp) {
      emitConnectivityProgress(onProgress, proxy.id, connectivity)
    }

    const finalResult: ProxyCheckResult = hasAliveDomain
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
            externalIp: connectivity.externalIp,
            checkTarget: bestCheck.domain,
            domainChecks,
            connectivity,
            errorDetails: failures.length > 0 ? failures : undefined,
            checkedAt
          }
        })()
      : !hasDomains
        ? {
            id: proxy.id,
            status: connectivityAlive ? 'alive' : 'dead',
            latencyMs: connectivity.latencyMs,
            externalIp: connectivity.externalIp,
            error: connectivityAlive ? undefined : connectivity.error,
            domainChecks,
            connectivity,
            checkedAt
          }
        : {
            id: proxy.id,
            status: 'dead',
            externalIp: connectivity.externalIp,
            error: buildSummaryError(failures),
            errorDetails: failures,
            domainChecks,
            connectivity,
            checkedAt
          }

    onProgress?.({ phase: 'complete', result: finalResult })
    return finalResult
  } catch (error) {
    const message = getErrorMessage(error)
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
      errorDetails: failures.length > 0 ? failures : undefined,
      domainChecks: failedChecks,
      connectivity,
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
