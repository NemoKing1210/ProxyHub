import type { ProxyListViewState } from './proxy-list-view'
import { DEFAULT_PROXY_LIST_VIEW, normalizeProxyListView } from './proxy-list-view'

export type ThemeMode = 'light' | 'dark' | 'system'

export type AppLanguage = 'en' | 'zh' | 'hi' | 'es' | 'fr' | 'ar' | 'pt' | 'ru' | 'uk' | 'ja' | 'de'

export type CheckAllMode = 'sequential' | 'parallel'

export type ProxyCardViewMode = 'standard' | 'compact'

export type AutoCheckScope = 'all' | 'favorites' | 'groups'

export interface CheckDomainEntry {
  domain: string
  enabled: boolean
}

export interface AppSettings {
  theme: ThemeMode
  language: AppLanguage
  checkDomains: CheckDomainEntry[]
  checkTimeoutMs: number
  checkAllMode: CheckAllMode
  checkAllConcurrency: number
  trayEnabled: boolean
  startMinimized: boolean
  backgroundCheckNotifications: boolean
  autoCheckEnabled: boolean
  autoCheckIntervalMinutes: number
  autoCheckNotifications: boolean
  autoCheckScope: AutoCheckScope
  autoCheckGroupIds: string[]
  proxyCardView: ProxyCardViewMode
  proxyListView: ProxyListViewState
}

export const CHECK_TIMEOUT_MIN_MS = 1_000
export const CHECK_TIMEOUT_MAX_MS = 120_000
export const CHECK_TIMEOUT_DEFAULT_MS = 10_000

export const CHECK_ALL_CONCURRENCY_MIN = 2
export const CHECK_ALL_CONCURRENCY_MAX = 20
export const CHECK_ALL_CONCURRENCY_DEFAULT = 5

export const AUTO_CHECK_INTERVAL_MIN = 1
export const AUTO_CHECK_INTERVAL_MAX = 1_440
export const AUTO_CHECK_INTERVAL_DEFAULT = 30

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  language: 'en',
  checkDomains: [],
  checkTimeoutMs: CHECK_TIMEOUT_DEFAULT_MS,
  checkAllMode: 'sequential',
  checkAllConcurrency: CHECK_ALL_CONCURRENCY_DEFAULT,
  trayEnabled: false,
  startMinimized: false,
  backgroundCheckNotifications: true,
  autoCheckEnabled: false,
  autoCheckIntervalMinutes: AUTO_CHECK_INTERVAL_DEFAULT,
  autoCheckNotifications: true,
  autoCheckScope: 'all',
  autoCheckGroupIds: [],
  proxyCardView: 'standard',
  proxyListView: DEFAULT_PROXY_LIST_VIEW
}

export interface ProxyCheckOptions {
  checkDomains: string[]
  checkTimeoutMs: number
  checkAllConcurrency: number
}

function clampCheckAllConcurrency(value: number): number {
  return Math.min(
    CHECK_ALL_CONCURRENCY_MAX,
    Math.max(CHECK_ALL_CONCURRENCY_MIN, Math.round(value))
  )
}

function clampAutoCheckIntervalMinutes(value: number): number {
  return Math.min(
    AUTO_CHECK_INTERVAL_MAX,
    Math.max(AUTO_CHECK_INTERVAL_MIN, Math.round(value))
  )
}

function normalizeAutoCheckScope(value: unknown): AutoCheckScope {
  if (value === 'favorites' || value === 'groups') {
    return value
  }

  return 'all'
}

function normalizeAutoCheckGroupIds(values: unknown): string[] {
  if (!Array.isArray(values)) {
    return []
  }

  const seen = new Set<string>()
  const result: string[] = []

  for (const value of values) {
    if (typeof value !== 'string') {
      continue
    }

    const id = value.trim()
    if (!id || seen.has(id)) {
      continue
    }

    seen.add(id)
    result.push(id)
  }

  return result
}

function normalizeCheckDomainEntry(value: unknown): CheckDomainEntry | null {
  if (typeof value === 'string') {
    const domain = value.trim().toLowerCase()
    return domain ? { domain, enabled: true } : null
  }

  if (value && typeof value === 'object' && 'domain' in value) {
    const entry = value as Partial<CheckDomainEntry>
    const domain = String(entry.domain ?? '')
      .trim()
      .toLowerCase()

    if (!domain) {
      return null
    }

    return {
      domain,
      enabled: entry.enabled !== false
    }
  }

  return null
}

export function normalizeCheckDomains(values: unknown): CheckDomainEntry[] {
  if (!Array.isArray(values)) {
    return []
  }

  const seen = new Set<string>()
  const result: CheckDomainEntry[] = []

  for (const value of values) {
    const entry = normalizeCheckDomainEntry(value)
    if (!entry || seen.has(entry.domain)) {
      continue
    }

    seen.add(entry.domain)
    result.push(entry)
  }

  return result
}

export function getCheckDomainNames(checkDomains: CheckDomainEntry[]): string[] {
  return checkDomains.map((entry) => entry.domain)
}

export function getEnabledCheckDomains(checkDomains: CheckDomainEntry[]): string[] {
  return checkDomains.filter((entry) => entry.enabled).map((entry) => entry.domain)
}

export function normalizeSettings(settings: Partial<AppSettings> | undefined): AppSettings {
  const merged = { ...DEFAULT_SETTINGS, ...(settings ?? {}) }

  const trayEnabled = merged.trayEnabled === true

  return {
    ...merged,
    checkDomains: normalizeCheckDomains(merged.checkDomains),
    checkAllMode: merged.checkAllMode === 'parallel' ? 'parallel' : 'sequential',
    checkAllConcurrency: clampCheckAllConcurrency(merged.checkAllConcurrency),
    trayEnabled,
    startMinimized: trayEnabled && merged.startMinimized === true,
    backgroundCheckNotifications: merged.backgroundCheckNotifications !== false,
    autoCheckEnabled: merged.autoCheckEnabled === true,
    autoCheckIntervalMinutes: clampAutoCheckIntervalMinutes(merged.autoCheckIntervalMinutes),
    autoCheckNotifications: merged.autoCheckNotifications !== false,
    autoCheckScope: normalizeAutoCheckScope(merged.autoCheckScope),
    autoCheckGroupIds:
      normalizeAutoCheckScope(merged.autoCheckScope) === 'groups'
        ? normalizeAutoCheckGroupIds(merged.autoCheckGroupIds)
        : [],
    proxyCardView: merged.proxyCardView === 'compact' ? 'compact' : 'standard',
    proxyListView: normalizeProxyListView(merged.proxyListView)
  }
}

export const SUPPORTED_LANGUAGES: { code: AppLanguage; label: string; countryCode: string }[] = [
  { code: 'en', label: 'English', countryCode: 'US' },
  { code: 'zh', label: '中文', countryCode: 'CN' },
  { code: 'hi', label: 'हिन्दी', countryCode: 'IN' },
  { code: 'es', label: 'Español', countryCode: 'ES' },
  { code: 'fr', label: 'Français', countryCode: 'FR' },
  { code: 'ar', label: 'العربية', countryCode: 'SA' },
  { code: 'pt', label: 'Português', countryCode: 'PT' },
  { code: 'ru', label: 'Русский', countryCode: 'RU' },
  { code: 'uk', label: 'Українська', countryCode: 'UA' },
  { code: 'ja', label: '日本語', countryCode: 'JP' },
  { code: 'de', label: 'Deutsch', countryCode: 'DE' }
]

export const RTL_LANGUAGES: AppLanguage[] = ['ar']
