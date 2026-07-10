import { normalizeCountryCode } from '../constants/proxy-countries'
import type {
  BackupFileV1,
  BackupGroupRecord,
  BackupImportMode,
  BackupImportResult,
  BackupParseErrorCode,
  BackupPayloadKind,
  BackupPayloadV1,
  BackupPreview,
  BackupProxiesPayload,
  BackupProxyRecord,
  BackupExportKind
} from '../types/backup'
import {
  BACKUP_FORMAT_ID,
  BACKUP_SCHEMA_VERSION
} from '../types/backup'
import type { Proxy, ProxyAnonymityLevel, ProxyColorId, ProxyIconId, ProxyProtocol } from '../types/proxy'
import {
  PROXY_ANONYMITY_LEVELS,
  PROXY_COLOR_IDS,
  PROXY_ICON_IDS,
  PROXY_PROTOCOLS
} from '../types/proxy'
import type { ProxyGroup } from '../types/proxy-group'
import type { AppSettings } from '../types/settings'
import { normalizeSettings } from '../types/settings'
import { normalizeGroupInput } from './proxy-group-appearance'
import { findDuplicateGroupName } from './proxy-group-identity'
import { findDuplicateProxy } from './proxy-identity'

export class BackupParseError extends Error {
  readonly code: BackupParseErrorCode

  constructor(code: BackupParseErrorCode, message: string) {
    super(message)
    this.name = 'BackupParseError'
    this.code = code
  }
}

interface BackupBuildInput {
  kind: BackupExportKind
  proxies: Proxy[]
  groups: ProxyGroup[]
  settings: AppSettings
  appVersion: string
}

interface StoreSnapshot {
  proxies: Proxy[]
  groups: ProxyGroup[]
  settings: AppSettings
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeId(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const id = value.trim()
  return id ? id : null
}

function normalizeIsoDate(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) {
    return null
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function normalizeProtocol(value: unknown): ProxyProtocol | null {
  if (typeof value !== 'string') {
    return null
  }

  const protocol = value.trim().toLowerCase()
  return PROXY_PROTOCOLS.includes(protocol as ProxyProtocol) ? (protocol as ProxyProtocol) : null
}

function normalizeProxyIcon(value: unknown): ProxyIconId | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  return PROXY_ICON_IDS.includes(value as ProxyIconId) ? (value as ProxyIconId) : undefined
}

function normalizeProxyColor(value: unknown): ProxyColorId | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  return PROXY_COLOR_IDS.includes(value as ProxyColorId) ? (value as ProxyColorId) : undefined
}

function normalizeAnonymity(value: unknown): ProxyAnonymityLevel | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const level = value.trim().toLowerCase()
  return PROXY_ANONYMITY_LEVELS.includes(level as ProxyAnonymityLevel)
    ? (level as ProxyAnonymityLevel)
    : undefined
}

function normalizeOptionalString(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  if (!trimmed || trimmed.length > maxLength) {
    return undefined
  }

  return trimmed
}

function normalizePayloadKind(value: unknown): BackupPayloadKind | null {
  if (value === 'full' || value === 'proxies' || value === 'settings') {
    return value
  }

  return null
}

export function stripProxyForBackup(proxy: Proxy): BackupProxyRecord {
  return {
    id: proxy.id,
    protocol: proxy.protocol,
    host: proxy.host,
    port: proxy.port,
    username: proxy.username,
    password: proxy.password,
    secret: proxy.secret,
    label: proxy.label,
    icon: proxy.icon,
    color: proxy.color,
    countryCode: proxy.countryCode,
    city: proxy.city,
    anonymityLevel: proxy.anonymityLevel,
    isFavorite: proxy.isFavorite,
    isEnabled: proxy.isEnabled,
    groupId: proxy.groupId,
    createdAt: proxy.createdAt
  }
}

export function stripGroupForBackup(group: ProxyGroup): BackupGroupRecord {
  return {
    id: group.id,
    name: group.name,
    icon: group.icon,
    color: group.color,
    createdAt: group.createdAt
  }
}

function normalizeGroupRecord(value: unknown): BackupGroupRecord | null {
  if (!isRecord(value)) {
    return null
  }

  const id = normalizeId(value.id)
  const createdAt = normalizeIsoDate(value.createdAt)
  const normalized = normalizeGroupInput({
    name: typeof value.name === 'string' ? value.name : '',
    icon: typeof value.icon === 'string' ? value.icon : undefined,
    color: typeof value.color === 'string' ? value.color : undefined
  })

  if (!id || !createdAt || !normalized.name) {
    return null
  }

  return {
    id,
    name: normalized.name,
    icon: normalized.icon,
    color: normalized.color,
    createdAt
  }
}

function normalizeProxyRecord(value: unknown): BackupProxyRecord | null {
  if (!isRecord(value)) {
    return null
  }

  const id = normalizeId(value.id)
  const protocol = normalizeProtocol(value.protocol)
  const host = normalizeOptionalString(value.host, 253)
  const port = typeof value.port === 'number' ? value.port : Number(value.port)
  const createdAt = normalizeIsoDate(value.createdAt)

  if (!id || !protocol || !host || !Number.isInteger(port) || port < 1 || port > 65535 || !createdAt) {
    return null
  }

  const groupId = normalizeId(value.groupId) ?? undefined

  return {
    id,
    protocol,
    host,
    port,
    username: normalizeOptionalString(value.username, 128),
    password: typeof value.password === 'string' ? value.password.slice(0, 128) : undefined,
    secret: normalizeOptionalString(value.secret, 512),
    label: normalizeOptionalString(value.label, 64),
    icon: normalizeProxyIcon(value.icon),
    color: normalizeProxyColor(value.color),
    countryCode: normalizeCountryCode(
      typeof value.countryCode === 'string' ? value.countryCode : undefined
    ),
    city: normalizeOptionalString(value.city, 64),
    anonymityLevel: normalizeAnonymity(value.anonymityLevel),
    isFavorite: value.isFavorite === true,
    isEnabled: value.isEnabled !== false,
    groupId,
    createdAt
  }
}

function normalizeProxiesPayload(value: unknown): BackupProxiesPayload | null {
  if (!isRecord(value)) {
    return null
  }

  if (!Array.isArray(value.groups) || !Array.isArray(value.items)) {
    return null
  }

  const groups: BackupGroupRecord[] = []
  const seenGroupIds = new Set<string>()

  for (const entry of value.groups) {
    const group = normalizeGroupRecord(entry)
    if (!group || seenGroupIds.has(group.id)) {
      continue
    }

    seenGroupIds.add(group.id)
    groups.push(group)
  }

  const items: BackupProxyRecord[] = []
  const seenProxyIds = new Set<string>()

  for (const entry of value.items) {
    const proxy = normalizeProxyRecord(entry)
    if (!proxy || seenProxyIds.has(proxy.id)) {
      continue
    }

    seenProxyIds.add(proxy.id)
    items.push(proxy)
  }

  return { groups, items }
}

function validatePayloadShape(payload: BackupPayloadV1): void {
  if (payload.kind === 'proxies' || payload.kind === 'full') {
    if (!payload.proxies) {
      throw new BackupParseError('invalid_payload', 'Backup is missing proxy data')
    }
  }

  if (payload.kind === 'settings' || payload.kind === 'full') {
    if (!payload.settings) {
      throw new BackupParseError('invalid_payload', 'Backup is missing settings data')
    }
  }
}

function parsePayloadV1(value: unknown): BackupPayloadV1 {
  if (!isRecord(value)) {
    throw new BackupParseError('invalid_payload', 'Backup payload is invalid')
  }

  const kind = normalizePayloadKind(value.kind)
  if (!kind) {
    throw new BackupParseError('invalid_payload', 'Backup payload kind is invalid')
  }

  const proxies =
    value.proxies === undefined
      ? undefined
      : (normalizeProxiesPayload(value.proxies) ?? undefined)
  if (value.proxies !== undefined && !proxies) {
    throw new BackupParseError('invalid_payload', 'Backup proxy section is invalid')
  }

  const settings =
    value.settings === undefined
      ? undefined
      : normalizeSettings(value.settings as Partial<AppSettings>)

  const payload: BackupPayloadV1 = {
    kind,
    proxies,
    settings
  }

  validatePayloadShape(payload)
  return payload
}

function parseBackupV1(raw: Record<string, unknown>): BackupFileV1 {
  if (raw.format !== BACKUP_FORMAT_ID) {
    throw new BackupParseError('invalid_format', 'Unrecognized backup format')
  }

  if (raw.version !== BACKUP_SCHEMA_VERSION) {
    throw new BackupParseError('unsupported_version', 'Unsupported backup version')
  }

  const exportedAt = normalizeIsoDate(raw.exportedAt)
  const appVersion = typeof raw.appVersion === 'string' ? raw.appVersion.trim() : ''

  if (!exportedAt || !appVersion) {
    throw new BackupParseError('invalid_payload', 'Backup metadata is incomplete')
  }

  return {
    format: BACKUP_FORMAT_ID,
    version: BACKUP_SCHEMA_VERSION,
    exportedAt,
    appVersion,
    payload: parsePayloadV1(raw.payload)
  }
}

export function buildBackupFile(input: BackupBuildInput): string {
  const exportedAt = new Date().toISOString()
  const payload: BackupPayloadV1 = {
    kind: input.kind
  }

  if (input.kind === 'full' || input.kind === 'proxies') {
    payload.proxies = {
      groups: input.groups.map(stripGroupForBackup),
      items: input.proxies.map(stripProxyForBackup)
    }
  }

  if (input.kind === 'full' || input.kind === 'settings') {
    payload.settings = normalizeSettings(input.settings)
  }

  const file: BackupFileV1 = {
    format: BACKUP_FORMAT_ID,
    version: BACKUP_SCHEMA_VERSION,
    exportedAt,
    appVersion: input.appVersion,
    payload
  }

  return `${JSON.stringify(file, null, 2)}\n`
}

export function parseBackupFile(content: string): BackupFileV1 {
  let raw: unknown

  try {
    raw = JSON.parse(content)
  } catch {
    throw new BackupParseError('invalid_json', 'Invalid JSON file')
  }

  if (!isRecord(raw)) {
    throw new BackupParseError('invalid_format', 'Unrecognized backup format')
  }

  return parseBackupV1(raw)
}

export function buildBackupPreview(
  backup: BackupFileV1,
  filePath: string,
  fileName: string
): BackupPreview {
  const proxies = backup.payload.proxies?.items ?? []
  const groups = backup.payload.proxies?.groups ?? []
  const settings = backup.payload.settings
  const hasSettings = backup.payload.kind === 'settings' || backup.payload.kind === 'full'

  return {
    filePath,
    fileName,
    format: backup.format,
    schemaVersion: backup.version,
    appVersion: backup.appVersion,
    exportedAt: backup.exportedAt,
    kind: backup.payload.kind,
    proxyCount: proxies.length,
    groupCount: groups.length,
    favoriteCount: proxies.filter((proxy) => proxy.isFavorite).length,
    enabledProxyCount: proxies.filter((proxy) => proxy.isEnabled !== false).length,
    hasSettings,
    checkDomainCount: settings?.checkDomains.length ?? 0,
    autoCheckEnabled: settings?.autoCheckEnabled === true,
    backupProxies: proxies,
    backupGroups: groups
  }
}

function backupRecordToProxy(record: BackupProxyRecord): Proxy {
  return {
    id: record.id,
    protocol: record.protocol,
    host: record.host.trim(),
    port: record.port,
    username: record.username,
    password: record.password,
    secret: record.secret,
    label: record.label,
    icon: record.icon,
    color: record.color,
    countryCode: record.countryCode,
    city: record.city,
    anonymityLevel: record.anonymityLevel,
    isFavorite: record.isFavorite,
    isEnabled: record.isEnabled,
    groupId: record.groupId,
    createdAt: record.createdAt,
    status: 'unknown'
  }
}

function backupRecordToGroup(record: BackupGroupRecord): ProxyGroup {
  return {
    id: record.id,
    name: record.name,
    icon: record.icon,
    color: record.color,
    createdAt: record.createdAt
  }
}

function sanitizeProxyGroupIds(proxies: Proxy[], groupIds: Set<string>): Proxy[] {
  return proxies.map((proxy) =>
    proxy.groupId && !groupIds.has(proxy.groupId) ? { ...proxy, groupId: undefined } : proxy
  )
}

function sanitizeSettingsGroupIds(settings: AppSettings, groupIds: Set<string>): AppSettings {
  return normalizeSettings({
    ...settings,
    autoCheckGroupIds:
      settings.autoCheckScope === 'groups'
        ? settings.autoCheckGroupIds.filter((id) => groupIds.has(id))
        : []
  })
}

function mergeGroups(
  existing: ProxyGroup[],
  incoming: BackupGroupRecord[]
): { groups: ProxyGroup[]; added: number; skipped: number } {
  const groups = [...existing]
  let added = 0
  let skipped = 0

  for (const record of incoming) {
    const group = backupRecordToGroup(record)

    if (groups.some((item) => item.id === group.id)) {
      skipped++
      continue
    }

    if (findDuplicateGroupName(group.name, groups)) {
      skipped++
      continue
    }

    groups.push(group)
    added++
  }

  return { groups, added, skipped }
}

function mergeProxies(
  existing: Proxy[],
  incoming: BackupProxyRecord[],
  validGroupIds: Set<string>
): { proxies: Proxy[]; added: number; skipped: number } {
  const proxies = [...existing]
  let added = 0
  let skipped = 0

  for (const record of incoming) {
    const proxy = backupRecordToProxy(record)

    if (findDuplicateProxy(proxy, proxies)) {
      skipped++
      continue
    }

    if (proxy.groupId && !validGroupIds.has(proxy.groupId)) {
      proxy.groupId = undefined
    }

    proxies.push(proxy)
    added++
  }

  return { proxies, added, skipped }
}

function replaceProxiesPayload(
  payload: BackupProxiesPayload
): { groups: ProxyGroup[]; proxies: Proxy[]; groupsAdded: number; proxiesAdded: number } {
  const groups = payload.groups.map(backupRecordToGroup)
  const groupIds = new Set(groups.map((group) => group.id))
  const proxies = sanitizeProxyGroupIds(
    payload.items.map(backupRecordToProxy),
    groupIds
  )

  return {
    groups,
    proxies,
    groupsAdded: groups.length,
    proxiesAdded: proxies.length
  }
}

export function applyBackupImport(
  backup: BackupFileV1,
  current: StoreSnapshot,
  mode: BackupImportMode,
  proxyIds?: string[]
): { data: StoreSnapshot; result: BackupImportResult } {
  const { payload } = backup
  let proxies = current.proxies
  let groups = current.groups
  let settings = current.settings

  let proxiesAdded = 0
  let proxiesSkipped = 0
  let groupsAdded = 0
  let groupsSkipped = 0
  let settingsImported = false

  const includesProxies = payload.kind === 'full' || payload.kind === 'proxies'
  const includesSettings = payload.kind === 'full' || payload.kind === 'settings'

  if (includesProxies && payload.proxies) {
    const proxiesPayload = resolveBackupImportProxies(payload.proxies, proxyIds)

    if (mode === 'replace') {
      const replaced = replaceProxiesPayload(proxiesPayload)
      groups = replaced.groups
      proxies = replaced.proxies
      groupsAdded = replaced.groupsAdded
      proxiesAdded = replaced.proxiesAdded
    } else {
      const mergedGroups = mergeGroups(groups, proxiesPayload.groups)
      groups = mergedGroups.groups
      groupsAdded = mergedGroups.added
      groupsSkipped = mergedGroups.skipped

      const validGroupIds = new Set(groups.map((group) => group.id))
      const mergedProxies = mergeProxies(proxies, proxiesPayload.items, validGroupIds)
      proxies = mergedProxies.proxies
      proxiesAdded = mergedProxies.added
      proxiesSkipped = mergedProxies.skipped
    }
  }

  if (includesSettings && payload.settings) {
    settings =
      mode === 'replace'
        ? normalizeSettings(payload.settings)
        : normalizeSettings({ ...settings, ...payload.settings })
    settingsImported = true
  }

  const groupIds = new Set(groups.map((group) => group.id))
  proxies = sanitizeProxyGroupIds(proxies, groupIds)
  settings = sanitizeSettingsGroupIds(settings, groupIds)

  return {
    data: {
      proxies,
      groups,
      settings
    },
    result: {
      kind: payload.kind,
      mode,
      proxiesAdded,
      proxiesSkipped,
      groupsAdded,
      groupsSkipped,
      settingsImported
    }
  }
}

export function resolveBackupExportProxies(
  proxies: Proxy[],
  groups: ProxyGroup[],
  proxyIds?: string[]
): { proxies: Proxy[]; groups: ProxyGroup[] } {
  if (!proxyIds) {
    return { proxies, groups }
  }

  const selectedIds = new Set(proxyIds)
  const selectedProxies = proxies.filter((proxy) => selectedIds.has(proxy.id))
  const groupIds = new Set(
    selectedProxies
      .map((proxy) => proxy.groupId)
      .filter((groupId): groupId is string => typeof groupId === 'string' && groupId.length > 0)
  )

  return {
    proxies: selectedProxies,
    groups: groups.filter((group) => groupIds.has(group.id))
  }
}

export function resolveBackupImportProxies(
  payload: BackupProxiesPayload,
  proxyIds?: string[]
): BackupProxiesPayload {
  if (!proxyIds) {
    return payload
  }

  const selectedIds = new Set(proxyIds)
  const items = payload.items.filter((item) => selectedIds.has(item.id))
  const groupIds = new Set(
    items
      .map((item) => item.groupId)
      .filter((groupId): groupId is string => typeof groupId === 'string' && groupId.length > 0)
  )

  return {
    items,
    groups: payload.groups.filter((group) => groupIds.has(group.id))
  }
}

export function mapBackupRecordsToProxies(records: BackupProxyRecord[]): Proxy[] {
  return records.map((record) => backupRecordToProxy(record))
}

export function mapBackupRecordsToGroups(records: BackupGroupRecord[]): ProxyGroup[] {
  return records.map((record) => backupRecordToGroup(record))
}
