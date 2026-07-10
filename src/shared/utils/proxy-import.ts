import { normalizeCountryCode } from '../constants/proxy-countries'
import type { CsvImportPreviewEntry, CsvImportResult } from '../types/proxy-import'
import type { Proxy, ProxyAnonymityLevel, ProxyInput, ProxyProtocol } from '../types/proxy'
import { PROXY_ANONYMITY_LEVELS, PROXY_PROTOCOLS } from '../types/proxy'
import { findDuplicateProxy } from './proxy-identity'

export const PROXY_IMPORT_CSV_HEADER = 'host,port,protocol,anonymity,https,country,city'

const ANONYMITY_ALIASES: Record<string, ProxyAnonymityLevel> = {
  elite: 'elite',
  anonymous: 'anonymous',
  anon: 'anonymous',
  transparent: 'transparent',
  trans: 'transparent'
}

const HEADER_FIELD_NAMES = new Set([
  'ip',
  'host',
  'port',
  'protocol',
  'anonymity',
  'https',
  'google',
  'country',
  'city'
])

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

function normalizeCity(value: string | undefined): string | undefined {
  const city = value?.trim()

  if (!city || city.toLowerCase() === 'unknown') {
    return undefined
  }

  return city
}

export function isProxyImportHeaderLine(line: string): boolean {
  const parts = line
    .trim()
    .toLowerCase()
    .split(',')
    .map((part) => part.trim())

  if (parts.length < 6) {
    return false
  }

  return parts.every((part) => HEADER_FIELD_NAMES.has(part))
}

/**
 * Parses a proxy list line:
 * host,port,protocol,anonymity,https,country,city
 */
export function parseProxyImportLine(line: string): ProxyInput | null {
  const trimmed = line.trim()

  if (!trimmed || trimmed.startsWith('#') || isProxyImportHeaderLine(trimmed)) {
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
    city: normalizeCity(cityValue)
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

export function formatProxyImportCsv(
  proxies: Array<
    Pick<Proxy, 'host' | 'port' | 'protocol' | 'anonymityLevel' | 'countryCode' | 'city'>
  >
): string {
  const lines = [PROXY_IMPORT_CSV_HEADER, ...proxies.map((proxy) => formatProxyImportLine(proxy))]
  return `${lines.join('\n')}\n`
}

export interface ParseProxyImportCsvResult {
  entries: Array<ProxyInput & { id: string }>
  invalidLineCount: number
  totalLineCount: number
}

export function parseProxyImportCsv(content: string): ParseProxyImportCsvResult {
  const lines = content.split(/\r?\n/)
  const entries: Array<ProxyInput & { id: string }> = []
  let invalidLineCount = 0

  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed) {
      continue
    }

    const parsed = parseProxyImportLine(line)

    if (!parsed) {
      if (!isProxyImportHeaderLine(trimmed) && !trimmed.startsWith('#')) {
        invalidLineCount += 1
      }

      continue
    }

    entries.push({
      ...parsed,
      id: `csv-${entries.length}`
    })
  }

  return {
    entries,
    invalidLineCount,
    totalLineCount: lines.filter((line) => line.trim()).length
  }
}

export function buildCsvImportPreviewEntries(
  content: string,
  existingProxies: Proxy[]
): {
  entries: CsvImportPreviewEntry[]
  invalidLineCount: number
  totalLineCount: number
} {
  const parsed = parseProxyImportCsv(content)

  const entries: CsvImportPreviewEntry[] = parsed.entries.map((entry) => ({
    id: entry.id,
    host: entry.host,
    port: entry.port,
    protocol: entry.protocol,
    anonymityLevel: entry.anonymityLevel,
    countryCode: entry.countryCode,
    city: entry.city,
    isDuplicate: Boolean(findDuplicateProxy(entry, existingProxies))
  }))

  return {
    entries,
    invalidLineCount: parsed.invalidLineCount,
    totalLineCount: parsed.totalLineCount
  }
}

function createImportedProxy(input: ProxyInput): Proxy {
  return {
    id: crypto.randomUUID(),
    ...input,
    isEnabled: true,
    createdAt: new Date().toISOString(),
    status: 'unknown'
  }
}

export function applyCsvImport(
  content: string,
  existingProxies: Proxy[],
  entryIds: string[],
  groupId?: string
): { proxies: Proxy[]; result: CsvImportResult } {
  const parsed = parseProxyImportCsv(content)
  const selectedIds = new Set(entryIds)
  const proxies = [...existingProxies]
  let added = 0
  let skippedDuplicates = 0

  for (const entry of parsed.entries) {
    if (!selectedIds.has(entry.id)) {
      continue
    }

    const input: ProxyInput = {
      host: entry.host,
      port: entry.port,
      protocol: entry.protocol,
      anonymityLevel: entry.anonymityLevel,
      countryCode: entry.countryCode,
      city: entry.city,
      groupId: groupId || undefined
    }

    if (findDuplicateProxy(input, proxies)) {
      skippedDuplicates += 1
      continue
    }

    proxies.push(createImportedProxy(input))
    added += 1
  }

  return {
    proxies,
    result: {
      added,
      skippedDuplicates
    }
  }
}

export function isValidAnonymityLevel(value: string): value is ProxyAnonymityLevel {
  return PROXY_ANONYMITY_LEVELS.includes(value as ProxyAnonymityLevel)
}
