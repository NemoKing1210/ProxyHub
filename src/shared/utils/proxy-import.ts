import { normalizeCountryCode } from '../constants/proxy-countries'
import type { ProxyListImportPreviewEntry, ProxyListImportResult } from '../types/proxy-import'
import type { Proxy, ProxyAnonymityLevel, ProxyInput, ProxyProtocol } from '../types/proxy'
import { PROXY_ANONYMITY_LEVELS, PROXY_PROTOCOLS } from '../types/proxy'
import { buildProxyUrl, parseProxyUrl } from './proxy-format'
import { findDuplicateProxy } from './proxy-identity'

export const PROXY_IMPORT_CSV_HEADER = 'host,port,protocol,username,password,secret,anonymity,https,country,city'

const ANONYMITY_ALIASES: Record<string, ProxyAnonymityLevel> = {
  elite: 'elite',
  anonymous: 'anonymous',
  transparent: 'transparent'
}


const HEADER_FIELD_NAMES: Record<string, true> = {
  ip: true,
  host: true,
  port: true,
  protocol: true,
  username: true,
  password: true,
  secret: true,
  anonymity: true,
  https: true,
  google: true,
  country: true,
  city: true
}


interface ProxyImportJsonRecord {
  proxy?: string
  protocol?: string
  ip?: string
  host?: string
  port?: number | string
  username?: string
  password?: string
  secret?: string
  https?: boolean
  anonymity?: string
  score?: number
  geolocation?: {
    country?: string
    city?: string
  }
}


export interface ParseProxyImportListResult {
  entries: Array<ProxyInput & { id: string }>
  invalidLineCount: number
  totalLineCount: number
}

export function normalizeAnonymityLevel(
  value: string | undefined
): ProxyAnonymityLevel | undefined {
  if (!value?.trim()) {
    return undefined
  }

  const normalized = value.trim().toLowerCase()
  return ANONYMITY_ALIASES[normalized]
}

function parseProtocol(value: string): ProxyProtocol | undefined {
  const protocol = value.trim().toLowerCase()

  return PROXY_PROTOCOLS.includes(protocol as ProxyProtocol)
    ? (protocol as ProxyProtocol)
    : undefined
}

function normalizeCity(value: string | undefined): string | undefined {
  const city = value?.trim()

  if (!city || city.toLowerCase() === 'unknown') {
    return undefined
  }

  return city
}

function exportCity(value: string | undefined): string {
  return value?.trim() || 'Unknown'
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

  return parts.every((part) => part in HEADER_FIELD_NAMES)
}

/**
 * Parses a proxy list line:
 * host,port,protocol,username,password,secret,anonymity,https,country,city
 * Legacy: host,port,protocol,anonymity,https,country,city (without auth)
 */
export function parseProxyImportLine(line: string): ProxyInput | null {
  const trimmed = line.trim()

  if (!trimmed || trimmed.startsWith('#') || isProxyImportHeaderLine(trimmed)) {
    return null
  }

  const parts = trimmed.split(',').map((part) => part.trim())

  if (parts.length < 7) {
    return null
  }

  let host: string
  let portValue: string
  let protocolValue: string
  let username: string | undefined
  let password: string | undefined
  let secret: string | undefined
  let anonymityValue: string
  let countryValue: string
  let cityValue: string

  if (parts.length >= 10) {
    // New format with auth
    ;[host, portValue, protocolValue, username, password, secret, anonymityValue, , countryValue, cityValue] = parts
  } else {
    // Legacy format without auth (7 columns)
    ;[host, portValue, protocolValue, anonymityValue, , countryValue, cityValue] = parts
  }

  const protocol = parseProtocol(protocolValue)
  const port = Number(portValue)

  if (!host || !protocol || !Number.isInteger(port) || port < 1 || port > 65535) {
    return null
  }

  return {
    host,
    port,
    protocol,
    username: username?.trim() || undefined,
    password: password?.trim() || undefined,
    secret: secret?.trim() || undefined,
    anonymityLevel: normalizeAnonymityLevel(anonymityValue),
    countryCode: normalizeCountryCode(countryValue),
    city: normalizeCity(cityValue)
  }
}

export function parseProxyImportTxtLine(line: string): ProxyInput | null {
  const trimmed = line.trim()

  if (!trimmed || trimmed.startsWith('#')) {
    return null
  }

  const parsed = parseProxyUrl(trimmed)

  if (!parsed) {
    return null
  }

  return {
    host: parsed.host,
    port: parsed.port,
    protocol: parsed.protocol,
    username: parsed.username,
    password: parsed.password
  }
}

function parseProxyImportJsonRecord(record: unknown): ProxyInput | null {
  if (!record || typeof record !== 'object') {
    return null
  }

  const entry = record as ProxyImportJsonRecord
  const fromProxyUrl = entry.proxy ? parseProxyUrl(entry.proxy) : null
  const host = (entry.ip ?? entry.host ?? fromProxyUrl?.host)?.trim()
  const portValue = entry.port ?? fromProxyUrl?.port
  const port = typeof portValue === 'string' ? Number(portValue) : portValue
  const protocol = parseProtocol(entry.protocol ?? fromProxyUrl?.protocol ?? '')

  if (
    !host ||
    !protocol ||
    port === undefined ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535
  ) {
    return null
  }

  return {
    host,
    port,
    protocol,
    username: entry.username?.trim() || fromProxyUrl?.username,
    password: entry.password?.trim() || fromProxyUrl?.password,
    secret: entry.secret?.trim() || fromProxyUrl?.secret,
    anonymityLevel: normalizeAnonymityLevel(entry.anonymity),
    countryCode: normalizeCountryCode(entry.geolocation?.country),
    city: normalizeCity(entry.geolocation?.city)
  }
}


export function formatProxyImportLine(
  proxy: Pick<Proxy, 'host' | 'port' | 'protocol' | 'username' | 'password' | 'secret' | 'anonymityLevel' | 'countryCode' | 'city'>
): string {
  const anonymity = proxy.anonymityLevel ?? ''
  const country = proxy.countryCode ?? ''
  const city = proxy.city ?? ''
  const username = proxy.username ?? ''
  const password = proxy.password ?? ''
  const secret = proxy.secret ?? ''

  return [proxy.host, proxy.port, proxy.protocol, username, password, secret, anonymity, 'false', country, city].join(',')
}

export function formatProxyImportCsv(
  proxies: Array<
    Pick<Proxy, 'host' | 'port' | 'protocol' | 'username' | 'password' | 'secret' | 'anonymityLevel' | 'countryCode' | 'city'>
  >
): string {
  const lines = [PROXY_IMPORT_CSV_HEADER, ...proxies.map((proxy) => formatProxyImportLine(proxy))]
  return `${lines.join('\n')}\n`
}

export function formatProxyImportTxt(
  proxies: Array<Pick<Proxy, 'host' | 'port' | 'protocol' | 'username' | 'password' | 'secret'>>
): string {
  const lines = proxies.map((proxy) => buildProxyUrl(proxy as Proxy))
  return `${lines.join('\n')}\n`
}

export function formatProxyImportJson(
  proxies: Array<
    Pick<Proxy, 'host' | 'port' | 'protocol' | 'username' | 'password' | 'secret' | 'anonymityLevel' | 'countryCode' | 'city'>
  >
): string {
  const records = proxies.map((proxy) => ({
    proxy: buildProxyUrl(proxy as Proxy),
    protocol: proxy.protocol,
    ip: proxy.host,
    port: proxy.port,
    username: proxy.username ?? '',
    password: proxy.password ?? '',
    secret: proxy.secret ?? '',
    https: proxy.protocol === 'https',
    anonymity: proxy.anonymityLevel ?? 'transparent',
    score: 1,
    geolocation: {
      country: proxy.countryCode ?? '',
      city: exportCity(proxy.city)
    }
  }))

  return `${JSON.stringify(records, null, 4)}\n`
}


function collectParsedEntries(
  items: Array<ProxyInput | null>,
  idPrefix: string,
  countInvalid: number,
  totalCount: number
): ParseProxyImportListResult {
  const entries: Array<ProxyInput & { id: string }> = []

  for (const parsed of items) {
    if (!parsed) {
      continue
    }

    entries.push({
      ...parsed,
      id: `${idPrefix}-${entries.length}`
    })
  }

  return {
    entries,
    invalidLineCount: countInvalid,
    totalLineCount: totalCount
  }
}

export function parseProxyImportCsv(content: string): ParseProxyImportListResult {
  const lines = content.split(/\r?\n/)
  const parsedItems: Array<ProxyInput | null> = []
  let invalidLineCount = 0
  let totalLineCount = 0

  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed) {
      continue
    }

    totalLineCount += 1
    const parsed = parseProxyImportLine(line)

    if (!parsed) {
      if (!isProxyImportHeaderLine(trimmed) && !trimmed.startsWith('#')) {
        invalidLineCount += 1
      }

      parsedItems.push(null)
      continue
    }

    parsedItems.push(parsed)
  }

  return collectParsedEntries(parsedItems, 'csv', invalidLineCount, totalLineCount)
}

export function parseProxyImportTxt(content: string): ParseProxyImportListResult {
  const lines = content.split(/\r?\n/)
  const parsedItems: Array<ProxyInput | null> = []
  let invalidLineCount = 0
  let totalLineCount = 0

  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed) {
      continue
    }

    totalLineCount += 1
    const parsed = parseProxyImportTxtLine(line)

    if (!parsed) {
      invalidLineCount += 1
      parsedItems.push(null)
      continue
    }

    parsedItems.push(parsed)
  }

  return collectParsedEntries(parsedItems, 'txt', invalidLineCount, totalLineCount)
}

export function parseProxyImportJson(content: string): ParseProxyImportListResult {
  let parsedJson: unknown

  try {
    parsedJson = JSON.parse(content)
  } catch {
    throw new Error('invalid_json')
  }

  const records = Array.isArray(parsedJson) ? parsedJson : [parsedJson]
  const parsedItems = records.map((record) => parseProxyImportJsonRecord(record))
  const invalidLineCount = parsedItems.filter((item) => item === null).length

  return collectParsedEntries(parsedItems, 'json', invalidLineCount, records.length)
}

export function buildProxyListImportPreviewEntries(
  parsed: ParseProxyImportListResult,
  existingProxies: Proxy[]
): {
  entries: ProxyListImportPreviewEntry[]
  invalidLineCount: number
  totalLineCount: number
} {
  const entries: ProxyListImportPreviewEntry[] = parsed.entries.map((entry) => ({
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

/** @deprecated Use buildProxyListImportPreviewEntries */
export function buildCsvImportPreviewEntries(
  content: string,
  existingProxies: Proxy[]
): {
  entries: ProxyListImportPreviewEntry[]
  invalidLineCount: number
  totalLineCount: number
} {
  return buildProxyListImportPreviewEntries(parseProxyImportCsv(content), existingProxies)
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

export function applyProxyListImport(
  parsed: ParseProxyImportListResult,
  existingProxies: Proxy[],
  entryIds: string[],
  groupId?: string
): { proxies: Proxy[]; result: ProxyListImportResult } {
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
      username: entry.username,
      password: entry.password,
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

/** @deprecated Use applyProxyListImport */
export function applyCsvImport(
  content: string,
  existingProxies: Proxy[],
  entryIds: string[],
  groupId?: string
): { proxies: Proxy[]; result: ProxyListImportResult } {
  return applyProxyListImport(parseProxyImportCsv(content), existingProxies, entryIds, groupId)
}

export function isValidAnonymityLevel(value: string): value is ProxyAnonymityLevel {
  return PROXY_ANONYMITY_LEVELS.includes(value as ProxyAnonymityLevel)
}
