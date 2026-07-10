import type { Proxy, ProxyInput, ProxyProtocol } from '../types/proxy'
import { PROXY_PROTOCOLS } from '../types/proxy'

type ProxyLike = Pick<Proxy, 'protocol' | 'host' | 'port' | 'username' | 'password'>

export type ParsedProxyUrl = Pick<ProxyInput, 'protocol' | 'host' | 'port' | 'username' | 'password'>

const PROTOCOL_PREFIX_PATTERN = /^(https?|socks4|socks5):\/\//i

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

/**
 * Parses a proxy URL or address string:
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

export function buildProxyUrl(proxy: ProxyLike): string {
  const auth =
    proxy.username && proxy.password
      ? `${encodeURIComponent(proxy.username)}:${encodeURIComponent(proxy.password)}@`
      : ''

  return `${proxy.protocol}://${auth}${proxy.host}:${proxy.port}`
}

export function formatProxyAddress(proxy: Pick<Proxy, 'host' | 'port'>): string {
  return `${proxy.host}:${proxy.port}`
}
