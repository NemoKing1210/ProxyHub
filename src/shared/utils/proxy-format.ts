import type { Proxy, ProxyInput, ProxyProtocol } from '../types/proxy'
import { PROXY_PROTOCOLS } from '../types/proxy'

type ProxyLike = Pick<Proxy, 'protocol' | 'host' | 'port' | 'username' | 'password' | 'secret'>

export type ParsedProxyUrl = Pick<
  ProxyInput,
  'protocol' | 'host' | 'port' | 'username' | 'password' | 'secret'
>

const PROTOCOL_PREFIX_PATTERN = /^(https?|socks4|socks5|mtproto):\/\//i
const TG_PROXY_PATTERN = /^tg:\/\/proxy\b/i
const TELEGRAM_PROXY_PATTERN = /^https?:\/\/t\.me\/proxy\b/i

function decodeAuthComponent(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function isValidProxyHost(host: string): boolean {
  if (host === 'localhost') {
    return true
  }

  const isIpv4 =
    /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/.test(host)
  const isHostname =
    /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/.test(
      host
    )

  return isIpv4 || isHostname
}

function parseProtocol(value: string): ProxyProtocol | undefined {
  const protocol = value.trim().toLowerCase()

  return PROXY_PROTOCOLS.includes(protocol as ProxyProtocol) ? (protocol as ProxyProtocol) : undefined
}

export function isValidMtprotoSecret(secret: string): boolean {
  const trimmed = secret.trim()

  if (!trimmed || !/^[0-9a-fA-F]+$/.test(trimmed)) {
    return false
  }

  const lower = trimmed.toLowerCase()

  if (lower.startsWith('ee')) {
    return lower.length >= 34
  }

  if (lower.startsWith('dd')) {
    return lower.length >= 34
  }

  return lower.length >= 32 && lower.length % 2 === 0
}

function normalizeMtprotoSecret(secret: string): string {
  return secret.trim().toLowerCase()
}

function parseMtprotoLink(input: string): ParsedProxyUrl | null {
  const trimmed = input.trim()

  if (!trimmed) {
    return null
  }

  let server: string | null = null
  let portValue: string | null = null
  let secret: string | null = null

  if (TG_PROXY_PATTERN.test(trimmed) || TELEGRAM_PROXY_PATTERN.test(trimmed)) {
    try {
      const normalized = TG_PROXY_PATTERN.test(trimmed)
        ? trimmed.replace(/^tg:\/\//i, 'https://')
        : trimmed
      const url = new URL(normalized)

      server = url.searchParams.get('server')
      portValue = url.searchParams.get('port')
      secret = url.searchParams.get('secret')
    } catch {
      return null
    }
  } else if (/^mtproto:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed.replace(/^mtproto:\/\//i, 'https://'))

      server = url.searchParams.get('server') ?? url.hostname
      portValue = url.searchParams.get('port') ?? (url.port || null)
      secret = url.searchParams.get('secret')
    } catch {
      return null
    }
  } else {
    return null
  }

  if (!server || !portValue || !secret) {
    return null
  }

  const host = server.trim()
  const port = Number(portValue)
  const normalizedSecret = normalizeMtprotoSecret(secret)

  if (
    !host ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535 ||
    !isValidProxyHost(host) ||
    !isValidMtprotoSecret(normalizedSecret)
  ) {
    return null
  }

  return {
    protocol: 'mtproto',
    host,
    port,
    secret: normalizedSecret
  }
}

/**
 * Parses a proxy URL or address string:
 * - tg://proxy?server=host&port=443&secret=...
 * - https://t.me/proxy?server=host&port=443&secret=...
 * - mtproto://host:443?secret=...
 * - socks5://user:pass@host:1080
 * - user:pass@host:1080
 * - http://host:8080
 * - host:8080
 */
export function parseProxyUrl(input: string): ParsedProxyUrl | null {
  const trimmed = input.trim()

  if (!trimmed) {
    return null
  }

  const mtprotoParsed = parseMtprotoLink(trimmed)

  if (mtprotoParsed) {
    return mtprotoParsed
  }

  let protocol: ProxyProtocol = 'http'
  let remainder = trimmed

  const protocolMatch = remainder.match(PROTOCOL_PREFIX_PATTERN)

  if (protocolMatch) {
    const parsedProtocol = parseProtocol(protocolMatch[1])

    if (!parsedProtocol) {
      return null
    }

    protocol = parsedProtocol
    remainder = remainder.slice(protocolMatch[0].length)

    if (protocol === 'mtproto') {
      try {
        const url = new URL(`https://${remainder}`)
        const host = url.searchParams.get('server') ?? url.hostname
        const portValue = url.searchParams.get('port') ?? url.port
        const secret = url.searchParams.get('secret')

        if (!host || !portValue || !secret) {
          return null
        }

        const port = Number(portValue)
        const normalizedSecret = normalizeMtprotoSecret(secret)

        if (
          !Number.isInteger(port) ||
          port < 1 ||
          port > 65535 ||
          !isValidProxyHost(host.trim()) ||
          !isValidMtprotoSecret(normalizedSecret)
        ) {
          return null
        }

        return {
          protocol: 'mtproto',
          host: host.trim(),
          port,
          secret: normalizedSecret
        }
      } catch {
        return null
      }
    }
  }

  remainder = remainder.split(/[/?#]/, 1)[0]?.trim() ?? ''

  if (!remainder) {
    return null
  }

  let username: string | undefined
  let password: string | undefined
  const atIndex = remainder.lastIndexOf('@')

  if (atIndex !== -1) {
    const authPart = remainder.slice(0, atIndex)
    remainder = remainder.slice(atIndex + 1)
    const colonIndex = authPart.indexOf(':')

    if (colonIndex !== -1) {
      username = decodeAuthComponent(authPart.slice(0, colonIndex))
      password = decodeAuthComponent(authPart.slice(colonIndex + 1))
    } else {
      username = decodeAuthComponent(authPart)
    }
  }

  const lastColon = remainder.lastIndexOf(':')

  if (lastColon === -1) {
    return null
  }

  const host = remainder.slice(0, lastColon).trim()
  const portValue = remainder.slice(lastColon + 1).trim()
  const port = Number(portValue)

  if (!host || !Number.isInteger(port) || port < 1 || port > 65535 || !isValidProxyHost(host)) {
    return null
  }

  return {
    protocol,
    host,
    port,
    username,
    password
  }
}

export function buildMtprotoProxyUrl(proxy: Pick<Proxy, 'host' | 'port' | 'secret'>): string {
  if (!proxy.secret) {
    return `mtproto://${proxy.host}:${proxy.port}`
  }

  const params = new URLSearchParams({
    server: proxy.host,
    port: String(proxy.port),
    secret: proxy.secret
  })

  return `tg://proxy?${params.toString()}`
}

export function buildProxyUrl(proxy: ProxyLike): string {
  if (proxy.protocol === 'mtproto') {
    return buildMtprotoProxyUrl(proxy)
  }

  const auth =
    proxy.username && proxy.password
      ? `${encodeURIComponent(proxy.username)}:${encodeURIComponent(proxy.password)}@`
      : ''

  return `${proxy.protocol}://${auth}${proxy.host}:${proxy.port}`
}

export function formatProxyAddress(proxy: Pick<Proxy, 'host' | 'port'>): string {
  return `${proxy.host}:${proxy.port}`
}

export function skipsDomainChecks(protocol: ProxyProtocol): boolean {
  return protocol === 'mtproto'
}
