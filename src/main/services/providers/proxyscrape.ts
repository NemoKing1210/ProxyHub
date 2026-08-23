import { randomUUID } from 'crypto'
import { parseProxyUrl } from '@shared/utils/proxy-format'
import type {
  ProviderError,
  ProviderFetchParams,
  ProviderFetchResult,
  ProviderProxy
} from '@shared/types/provider'
import type { ProxyProtocol } from '@shared/types/proxy'

const PROXYSCRAPE_ENDPOINT = 'https://api.proxyscrape.com/v4/free-proxy-list/get'
const FETCH_TIMEOUT_MS = 15_000

function mapProtocol(protocol: ProviderFetchParams['protocol']): string | undefined {
  if (!protocol || protocol === 'all') return undefined
  return protocol
}

function buildUrl(params: ProviderFetchParams): string {
  const url = new URL(PROXYSCRAPE_ENDPOINT)
  url.searchParams.set('request', 'display_proxies')
  url.searchParams.set('format', 'json')

  const protocol = mapProtocol(params.protocol)
  if (protocol) {
    url.searchParams.set('protocol', protocol)
  }

  if (params.timeoutMs !== undefined) {
    url.searchParams.set('timeout', String(params.timeoutMs))
  }

  if (params.limit !== undefined) {
    url.searchParams.set('limit', String(params.limit))
  }

  if (params.country) {
    url.searchParams.set('country', params.country)
  }

  return url.toString()
}

function toProviderProtocol(value: unknown): ProxyProtocol {
  const v = String(value ?? '').toLowerCase()
  if (v === 'socks4') return 'socks4'
  if (v === 'socks5') return 'socks5'
  return 'http'
}

function normalizeCountryCode(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim().length === 2) return value.trim().toUpperCase()
  return undefined
}

function createProviderProxyFromRaw(raw: unknown): ProviderProxy | null {
  if (!raw || typeof raw !== 'object') return null
  const entry = raw as Record<string, unknown>

  // ProxyScrape v4 returns fields like: proxy, protocol, ip_data { countryCode }, anonymity, timeout, ssl
  const proxyString = typeof entry['proxy'] === 'string' ? (entry['proxy'] as string) : null
  const ip = typeof entry['ip'] === 'string' ? (entry['ip'] as string) : null
  const portRaw = entry['port']
  const portNum =
    typeof portRaw === 'number' ? portRaw : typeof portRaw === 'string' ? Number(portRaw) : NaN

  const protocolRaw = entry['protocol']
  const protocol = toProviderProtocol(protocolRaw)

  const ipData = entry['ip_data'] as Record<string, unknown> | undefined
  const countryCode =
    normalizeCountryCode(ipData?.['countryCode']) ??
    normalizeCountryCode(entry['countryCode']) ??
    normalizeCountryCode(entry['country']) ??
    undefined

  const anonymity =
    typeof entry['anonymity'] === 'string' ? (entry['anonymity'] as string) : undefined
  const timeout = typeof entry['timeout'] === 'number' ? entry['timeout'] : undefined
  const ssl = typeof entry['ssl'] === 'boolean' ? entry['ssl'] : undefined

  let host: string | null = null
  let port: number | null = null
  let parsedProtocol: ProxyProtocol | null = null

  if (proxyString) {
    // Try parse as full proxy address; prefix protocol for parser
    const withScheme = proxyString.includes('://') ? proxyString : `${protocol}://${proxyString}`
    const parsed = parseProxyUrl(withScheme) ?? parseProxyUrl(proxyString)
    if (parsed) {
      host = parsed.host
      port = parsed.port
      parsedProtocol = parsed.protocol
    } else {
      // fallback: split host:port
      const [h, p] = proxyString.split(':')
      if (h && p) {
        const pn = Number(p)
        if (Number.isFinite(pn) && pn > 0 && pn <= 65535) {
          host = h
          port = pn
        }
      }
    }
  } else if (ip && Number.isFinite(portNum)) {
    host = ip
    port = portNum
  }

  if (!host || !port) return null

  const finalProtocol = parsedProtocol ?? protocol

  const anonymityLevel = (() => {
    const a = (anonymity ?? '').toLowerCase()
    if (a.includes('elite')) return 'elite' as const
    if (a.includes('anonymous')) return 'anonymous' as const
    if (a.includes('transparent')) return 'transparent' as const
    return undefined
  })()

  const proxy: ProviderProxy = {
    id: randomUUID(),
    protocol: finalProtocol,
    host,
    port,
    createdAt: new Date().toISOString(),
    status: 'unknown',
    providerId: 'proxyscrape',
    countryCode,
    anonymityLevel,
    providerMeta: {
      anonymity,
      timeout,
      ssl
    }
  }

  return proxy
}

export async function fetchProxyScrapeProxies(
  params: ProviderFetchParams,
  signal?: AbortSignal
): Promise<ProviderFetchResult> {
  const url = buildUrl(params)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  const onAbort = (): void => controller.abort()
  if (signal) {
    if (signal.aborted) controller.abort()
    else signal.addEventListener('abort', onAbort, { once: true })
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'ProxyHub',
        Accept: 'application/json'
      },
      signal: controller.signal
    })

    if (response.status === 429) {
      const err: ProviderError = { code: 'rate_limited', message: 'Rate limited by ProxyScrape' }
      throw err
    }

    if (!response.ok) {
      const err: ProviderError = {
        code: 'network_error',
        message: `ProxyScrape request failed: ${response.status} ${response.statusText}`
      }
      throw err
    }

    const text = await response.text()
    let json: unknown
    try {
      json = JSON.parse(text)
    } catch {
      const err: ProviderError = {
        code: 'parse_error',
        message: 'Failed to parse ProxyScrape response'
      }
      throw err
    }

    // API may return { proxies: [...] } or { data: [...] } or array directly
    const rawList: unknown[] = Array.isArray(json)
      ? json
      : Array.isArray((json as Record<string, unknown>)['proxies'])
        ? ((json as Record<string, unknown>)['proxies'] as unknown[])
        : Array.isArray((json as Record<string, unknown>)['data'])
          ? ((json as Record<string, unknown>)['data'] as unknown[])
          : []

    const proxies: ProviderProxy[] = []
    for (const raw of rawList) {
      const p = createProviderProxyFromRaw(raw)
      if (p) proxies.push(p)
    }

    return {
      proxies,
      total: proxies.length,
      fetchedAt: new Date().toISOString()
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
      throw error
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      if (signal?.aborted) {
        const err: ProviderError = { code: 'network_error', message: 'Request aborted' }
        throw err
      }
      const err: ProviderError = { code: 'network_error', message: 'Request timed out' }
      throw err
    }

    if (error instanceof Error && error.name === 'AbortError') {
      const err: ProviderError = { code: 'network_error', message: 'Request timed out' }
      throw err
    }

    const message = error instanceof Error ? error.message : String(error)
    const err: ProviderError = { code: 'network_error', message }
    throw err
  } finally {
    clearTimeout(timeoutId)
    if (signal) signal.removeEventListener('abort', onAbort)
  }
}
