import { normalizeCountryCode } from '../constants/proxy-countries'
import type { Proxy, ProxyAnonymityLevel, ProxyInput, ProxyProtocol } from '../types/proxy'
import { PROXY_ANONYMITY_LEVELS, PROXY_PROTOCOLS } from '../types/proxy'

const ANONYMITY_ALIASES: Record<string, ProxyAnonymityLevel> = {
  elite: 'elite',
  anonymous: 'anonymous',
  anon: 'anonymous',
  transparent: 'transparent',
  trans: 'transparent'
}

export function normalizeAnonymityLevel(value: string | undefined): ProxyAnonymityLevel | undefined {
  if (!value?.trim()) {
    return undefined
  }

  const normalized = value.trim().toLowerCase()
  return ANONYMITY_ALIASES[normalized]
}

function parseProtocol(value: string): ProxyProtocol | undefined {
  const protocol = value.trim().toLowerCase()

  return PROXY_PROTOCOLS.includes(protocol as ProxyProtocol) ? (protocol as ProxyProtocol) : undefined
}

/**
 * Parses a proxy list line:
 * host,port,protocol,anonymity,google,country,city
 */
export function parseProxyImportLine(line: string): ProxyInput | null {
  const trimmed = line.trim()

  if (!trimmed || trimmed.startsWith('#')) {
    return null
  }

  const parts = trimmed.split(',').map((part) => part.trim())

  if (parts.length < 6) {
    return null
  }

  const [host, portValue, protocolValue, anonymityValue, , countryValue, cityValue] = parts
  const protocol = parseProtocol(protocolValue)
  const port = Number(portValue)

  if (!host || !protocol || !Number.isInteger(port) || port < 1 || port > 65535) {
    return null
  }

  return {
    host,
    port,
    protocol,
    anonymityLevel: normalizeAnonymityLevel(anonymityValue),
    countryCode: normalizeCountryCode(countryValue),
    city: cityValue?.trim() || undefined
  }
}

export function formatProxyImportLine(
  proxy: Pick<Proxy, 'host' | 'port' | 'protocol' | 'anonymityLevel' | 'countryCode' | 'city'>
): string {
  const anonymity = proxy.anonymityLevel ?? ''
  const country = proxy.countryCode ?? ''
  const city = proxy.city ?? ''

  return [proxy.host, proxy.port, proxy.protocol, anonymity, 'false', country, city].join(',')
}

export function isValidAnonymityLevel(value: string): value is ProxyAnonymityLevel {
  return PROXY_ANONYMITY_LEVELS.includes(value as ProxyAnonymityLevel)
}
