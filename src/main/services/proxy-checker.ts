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
} from '@shared/types/proxy'
import { buildProxyUrl, formatProxyAddress, skipsDomainChecks } from '@shared/utils/proxy-format'
import { runWithConcurrency } from '@shared/utils/run-with-concurrency'
import {
  createCheckingConnectivity,
  createPendingDomainChecks
} from '@shared/utils/proxy-check-results'
import { CheckCancelledError, isCheckCancelledError, throwIfCancelled } from './check-cancellation'
import { logger } from './logger'

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

function createConnectivityBase(
  proxy: Proxy
): Pick<ProxyConnectivityResult, 'address' | 'protocol' | 'proxyUrl'> {
  return {
    address: formatProxyAddress(proxy),
    protocol: proxy.protocol,
    proxyUrl: buildProxyUrl(proxy)
  }
}

function testTcpConnection(
  host: string,
  port: number,
  timeoutMs: number,
  signal?: AbortSignal
): Promise<{ latencyMs: number }> {
  return new Promise((resolve, reject) => {
    throwIfCancelled(signal)

    const start = Date.now()
    const socket = net.createConnection({ host, port })

    const cleanup = (): void => {
      signal?.removeEventListener('abort', onAbort)
      socket.removeAllListeners()
      socket.destroy()
    }

    const onAbort = (): void => {
      cleanup()
      reject(new CheckCancelledError())
    }

    signal?.addEventListener('abort', onAbort)

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
  timeoutMs: number,
  signal?: AbortSignal
): Promise<{ latencyMs: number }> {
  const reqLog = logger.scope('proxy-checker')
  reqLog.debug('Request through proxy', { checkUrl, timeoutMs })
  return new Promise((resolve, reject) => {
    throwIfCancelled(signal)

    const start = Date.now()

    const request = https.request(
      checkUrl,
      createHttpsRequestOptions(agent, timeoutMs, 'HEAD'),
      (response) => {
        response.resume()

        if (response.statusCode && response.statusCode >= 400) {
          reqLog.debug('Proxy request failed with HTTP status', {
            checkUrl,
            status: response.statusCode
          })
          reject(new Error(`HTTP ${response.statusCode}`))
          return
        }

        const latencyMs = Date.now() - start
        reqLog.debug('Proxy request succeeded', {
          checkUrl,
          latencyMs,
          status: response.statusCode
        })
        resolve({ latencyMs })
      }
    )

    const onAbort = (): void => {
      reqLog.warn('Proxy request cancelled', { checkUrl })
      request.destroy()
      reject(new CheckCancelledError())
    }

    signal?.addEventListener('abort', onAbort, { once: true })

    request.on('timeout', () => {
      signal?.removeEventListener('abort', onAbort)
      request.destroy()
      reqLog.debug('Proxy request timeout', { checkUrl })
      reject(new Error('Connection timeout'))
    })

    request.on('error', (error) => {
      signal?.removeEventListener('abort', onAbort)
      reqLog.debug('Proxy request error', { checkUrl, error: error.message })
      reject(error)
    })

    request.on('close', () => {
      signal?.removeEventListener('abort', onAbort)
    })

    request.end()
  })
}

function fetchExternalIp(
  agent: http.Agent,
  timeoutMs: number,
  signal?: AbortSignal
): Promise<string> {
  const ipLog = logger.scope('proxy-checker')
  ipLog.debug('Fetching external IP', { url: EXTERNAL_IP_URL, timeoutMs })
  return new Promise((resolve, reject) => {
    throwIfCancelled(signal)

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
            ipLog.debug('External IP fetch HTTP error', { status: response.statusCode })
            reject(new Error(`HTTP ${response.statusCode}`))
            return
          }

          try {
            const parsed = JSON.parse(body) as { ip?: string }

            if (!parsed.ip) {
              ipLog.warn('Invalid IP response', { body: body.slice(0, 200) })
              reject(new Error('Invalid IP response'))
              return
            }

            ipLog.debug('External IP fetched', { ip: parsed.ip })
            resolve(parsed.ip)
          } catch (error) {
            ipLog.debug('Failed to parse IP response', { error, body: body.slice(0, 200) })
            reject(new Error('Failed to parse IP response'))
          }
        })
      }
    )

    const onAbort = (): void => {
      ipLog.warn('External IP fetch cancelled')
      request.destroy()
      reject(new CheckCancelledError())
    }

    signal?.addEventListener('abort', onAbort, { once: true })

    request.on('timeout', () => {
      signal?.removeEventListener('abort', onAbort)
      request.destroy()
      ipLog.debug('External IP fetch timeout')
      reject(new Error('Connection timeout'))
    })

    request.on('error', (error) => {
      signal?.removeEventListener('abort', onAbort)
      ipLog.debug('External IP fetch error', { error: error.message })
      reject(error)
    })

    request.on('close', () => {
      signal?.removeEventListener('abort', onAbort)
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
  onProgress?: (progress: ProxyCheckProgress) => void,
  signal?: AbortSignal
): Promise<ProxyConnectivityResult> {
  const log = logger.scope('proxy-checker')
  const base = createConnectivityBase(proxy)

  throwIfCancelled(signal)
  log.debug('Checking proxy connectivity', { proxyId: proxy.id, address: base.address, timeoutMs })

  emitConnectivityProgress(onProgress, proxy.id, {
    ...base,
    status: 'checking'
  })

  try {
    const result = await testTcpConnection(proxy.host, proxy.port, timeoutMs, signal)
    const connectivity: ProxyConnectivityResult = {
      ...base,
      status: 'alive',
      latencyMs: result.latencyMs
    }

    log.debug('Proxy connectivity alive', { proxyId: proxy.id, latencyMs: result.latencyMs })
    emitConnectivityProgress(onProgress, proxy.id, connectivity)
    return connectivity
  } catch (error) {
    if (isCheckCancelledError(error)) {
      log.warn('Proxy connectivity check cancelled', { proxyId: proxy.id })
      throw error
    }

    const message = getErrorMessage(error)
    log.debug('Proxy connectivity dead', { proxyId: proxy.id, error: message })
    const connectivity: ProxyConnectivityResult = {
      ...base,
      status: 'dead',
      error: message,
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
  hasAliveDomain: boolean,
  fetchExternalIpEnabled: boolean,
  signal?: AbortSignal
): Promise<ProxyConnectivityResult> {
  const log = logger.scope('proxy-checker')
  if (!fetchExternalIpEnabled || (connectivity.status !== 'alive' && !hasAliveDomain)) {
    log.debug('Skipping external IP fetch', {
      enabled: fetchExternalIpEnabled,
      connectivity: connectivity.status,
      hasAliveDomain
    })
    return connectivity
  }

  try {
    log.debug('Resolving external IP', { connectivity: connectivity.status, hasAliveDomain })
    const externalIp = await fetchExternalIp(agent, timeoutMs, signal)
    log.debug('External IP resolved', { externalIp })
    return { ...connectivity, externalIp }
  } catch (error) {
    if (isCheckCancelledError(error)) {
      log.warn('External IP resolution cancelled')
      throw error
    }

    log.debug('External IP fetch failed, returning connectivity without IP', {
      error: error instanceof Error ? error.message : String(error)
    })
    return connectivity
  }
}

export async function checkProxy(
  proxy: Proxy,
  domains: string[],
  timeoutMs: number,
  onProgress?: (progress: ProxyCheckProgress) => void,
  signal?: AbortSignal,
  domainCheckConcurrency = 1,
  fetchExternalIpEnabled = true
): Promise<ProxyCheckResult> {
  const log = logger.scope('proxy-checker')
  try {
    throwIfCancelled(signal)
  } catch (error) {
    log.warn('checkProxy cancelled before start', { proxyId: proxy.id })
    throw error
  }

  log.info('checkProxy started', {
    proxyId: proxy.id,
    protocol: proxy.protocol,
    domains,
    timeoutMs,
    domainCheckConcurrency,
    fetchExternalIp: fetchExternalIpEnabled
  })
  const targets = skipsDomainChecks(proxy.protocol) ? [] : domains
  if (targets.length === 0 && !skipsDomainChecks(proxy.protocol)) {
    log.debug('No domains to check', { proxyId: proxy.id })
  }
  const checkedAt = new Date().toISOString()
  const pendingChecks = createPendingDomainChecks(targets)
  const initialConnectivity = createCheckingConnectivity(proxy)

  onProgress?.({
    phase: 'init',
    proxyId: proxy.id,
    domainChecks: pendingChecks,
    connectivity: initialConnectivity
  })
  log.debug('Initial connectivity emitted', {
    proxyId: proxy.id,
    pendingChecks: pendingChecks.length
  })

  let connectivity = await checkProxyConnectivity(proxy, timeoutMs, onProgress, signal)
  log.debug('Initial connectivity result', { proxyId: proxy.id, status: connectivity.status })

  if (skipsDomainChecks(proxy.protocol)) {
    const connectivityAlive = connectivity.status === 'alive'
    const finalResult: ProxyCheckResult = {
      id: proxy.id,
      status: connectivityAlive ? 'alive' : 'dead',
      latencyMs: connectivity.latencyMs,
      error: connectivityAlive ? undefined : connectivity.error,
      domainChecks: [],
      connectivity,
      checkedAt
    }

    log.info('checkProxy completed (skipped domain checks)', {
      proxyId: proxy.id,
      status: finalResult.status
    })
    onProgress?.({ phase: 'complete', result: finalResult })
    return finalResult
  }

  try {
    const agent = createAgent(proxy)
    log.debug('Proxy agent created', { proxyId: proxy.id })
    const domainChecks: ProxyDomainCheckResult[] = new Array(targets.length)
    const domainConcurrency = Math.max(1, Math.min(domainCheckConcurrency, targets.length))
    log.debug('Starting domain checks', { proxyId: proxy.id, targets, domainConcurrency })

    await runWithConcurrency(
      targets,
      domainConcurrency,
      async (domain, domainIndex) => {
        throwIfCancelled(signal)

        const checkUrl = normalizeDomain(domain)
        log.debug('Domain check starting', { proxyId: proxy.id, domain, checkUrl })

        emitDomainProgress(onProgress, proxy.id, {
          domain,
          url: checkUrl,
          status: 'checking'
        })

        try {
          const result = await requestThroughProxy(agent, checkUrl, timeoutMs, signal)
          const completed: ProxyDomainCheckResult = {
            domain,
            url: checkUrl,
            status: 'alive',
            latencyMs: result.latencyMs
          }

          log.debug('Domain check alive', {
            proxyId: proxy.id,
            domain,
            latencyMs: result.latencyMs
          })
          domainChecks[domainIndex] = completed
          emitDomainProgress(onProgress, proxy.id, completed)
        } catch (error) {
          if (isCheckCancelledError(error)) {
            log.warn('Domain check cancelled', { proxyId: proxy.id, domain })
            throw error
          }

          const detail = createErrorDetail(error, domain, checkUrl)
          log.debug('Domain check dead', {
            proxyId: proxy.id,
            domain,
            error: detail.message,
            code: detail.code
          })
          const completed: ProxyDomainCheckResult = {
            domain,
            url: checkUrl,
            status: 'dead',
            error: detail.message,
            code: detail.code
          }

          domainChecks[domainIndex] = completed
          emitDomainProgress(onProgress, proxy.id, completed)
        }
      },
      () => Boolean(signal?.aborted)
    )

    const completedDomainChecks = domainChecks.filter(
      (check): check is ProxyDomainCheckResult => check !== undefined
    )
    const aliveChecks = completedDomainChecks.filter((check) => check.status === 'alive')
    const failures = toErrorDetails(completedDomainChecks)
    const hasAliveDomain = aliveChecks.length > 0
    const hasDomains = targets.length > 0
    const connectivityAlive = connectivity.status === 'alive'
    log.debug('Domain checks completed', {
      proxyId: proxy.id,
      total: completedDomainChecks.length,
      alive: aliveChecks.length,
      failures: failures.length
    })

    connectivity = await resolveExternalIp(
      agent,
      timeoutMs,
      connectivity,
      hasAliveDomain || (!hasDomains && connectivityAlive),
      fetchExternalIpEnabled,
      signal
    )

    if (connectivity.externalIp) {
      log.debug('External IP attached to connectivity', {
        proxyId: proxy.id,
        externalIp: connectivity.externalIp
      })
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
            domainChecks: completedDomainChecks,
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
            domainChecks: completedDomainChecks,
            connectivity,
            checkedAt
          }
        : {
            id: proxy.id,
            status: 'dead',
            externalIp: connectivity.externalIp,
            error: buildSummaryError(failures),
            errorDetails: failures,
            domainChecks: completedDomainChecks,
            connectivity,
            checkedAt
          }

    log.info('checkProxy completed', {
      proxyId: proxy.id,
      status: finalResult.status,
      latencyMs: finalResult.latencyMs,
      aliveDomains: aliveChecks.length
    })
    onProgress?.({ phase: 'complete', result: finalResult })
    return finalResult
  } catch (error) {
    if (isCheckCancelledError(error)) {
      log.warn('checkProxy cancelled', { proxyId: proxy.id })
      throw error
    }

    const message = getErrorMessage(error)
    const code = getErrorCode(error)
    log.error('checkProxy failed', error)
    const failedChecks = buildAgentFailureChecks(targets, message, code)
    log.debug('Built agent failure checks', { proxyId: proxy.id, count: failedChecks.length })

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

    log.info('checkProxy failed result', {
      proxyId: proxy.id,
      status: finalResult.status,
      error: message
    })
    onProgress?.({ phase: 'complete', result: finalResult })
    return finalResult
  }
}

export async function checkAllProxies(
  proxies: Proxy[],
  domains: string[],
  onProgress: (progress: ProxyCheckProgress) => void,
  timeoutMs: number,
  concurrency = DEFAULT_CONCURRENCY,
  signal?: AbortSignal,
  domainCheckConcurrency = 1,
  fetchExternalIpEnabled = true
): Promise<void> {
  const checkLog = logger.scope('proxy-checker')
  checkLog.info('checkAll started', {
    total: proxies.length,
    domains,
    timeoutMs,
    concurrency,
    domainCheckConcurrency,
    fetchExternalIp: fetchExternalIpEnabled
  })
  let index = 0

  async function worker(): Promise<void> {
    while (index < proxies.length) {
      try {
        throwIfCancelled(signal)
      } catch {
        checkLog.warn('checkAll worker cancelled', { index })
        return
      }

      const currentIndex = index
      index += 1

      const proxy = proxies[currentIndex]
      checkLog.debug('checkAll worker checking proxy', { proxyId: proxy.id, index: currentIndex })

      try {
        await checkProxy(
          proxy,
          domains,
          timeoutMs,
          onProgress,
          signal,
          domainCheckConcurrency,
          fetchExternalIpEnabled
        )
        checkLog.info('checkAll proxy completed', { proxyId: proxy.id })
      } catch (error) {
        if (isCheckCancelledError(error)) {
          checkLog.warn('checkAll cancelled during proxy', { proxyId: proxy.id })
          return
        }

        checkLog.error('checkAll proxy error', error)
        throw error
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, proxies.length) }, () => worker())
  try {
    await Promise.all(workers)
    checkLog.info('checkAll completed', { total: proxies.length })
  } catch (error) {
    if (isCheckCancelledError(error)) {
      checkLog.warn('checkAll cancelled', { total: proxies.length })
      throw error
    }
    checkLog.error('checkAll failed', error)
    throw error
  }
}
