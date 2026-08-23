import { DEFAULT_LOG_LEVEL, normalizeLogLevel, type LogLevel } from './logger'
import type { ProxyListViewState } from './proxy-list-view'
import { DEFAULT_PROXY_LIST_VIEW, normalizeProxyListView } from './proxy-list-view'

export type ThemeMode = 'light' | 'dark' | 'system'

export const ACCENT_COLOR_DEFAULT = '#5c8aff'

export const ACCENT_COLOR_OPTIONS = [
  { id: 'blue', value: ACCENT_COLOR_DEFAULT },
  { id: 'violet', value: '#8b6cff' },
  { id: 'teal', value: '#16a6a0' },
  { id: 'green', value: '#35a66f' },
  { id: 'orange', value: '#d9852b' },
  { id: 'red', value: '#d95b68' },
  { id: 'pink', value: '#d45eaa' },
  { id: 'cyan', value: '#3b9ee8' }
] as const

export type AppLanguage = 'en' | 'zh' | 'hi' | 'es' | 'fr' | 'ar' | 'pt' | 'ru' | 'uk' | 'ja' | 'de'

export type CheckAllMode = 'sequential' | 'parallel'

export type ProxyCardViewMode = 'standard' | 'compact'

export type ToastPosition =
  'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'

export type AutoCheckScope = 'all' | 'favorites' | 'groups'

export type AppRoute = '/' | '/settings' | '/providers'

export interface CheckDomainEntry {
  domain: string
  enabled: boolean
}

export interface AppSettings {
  theme: ThemeMode
  accentColor: string
  language: AppLanguage
  checkDomains: CheckDomainEntry[]
  checkTimeoutMs: number
  checkAllMode: CheckAllMode
  checkAllConcurrency: number
  domainCheckConcurrency: number
  fetchExternalIp: boolean
  trayEnabled: boolean
  startMinimized: boolean
  launchAtLogin: boolean
  autoCheckEnabled: boolean
  autoCheckIntervalMinutes: number
  autoCheckNotifications: boolean
  autoCheckScope: AutoCheckScope
  autoCheckGroupIds: string[]
  proxyCardView: ProxyCardViewMode
  proxyDragEnabled: boolean
  toastEnabled: boolean
  toastPosition: ToastPosition
  proxyListView: ProxyListViewState
  lastRoute: AppRoute
  logLevel: LogLevel
}

export type SyncableAppSettings = Omit<
  AppSettings,
  'lastRoute' | 'proxyListView' | 'launchAtLogin' | 'logLevel'
>

export const CHECK_TIMEOUT_MIN_MS = 1_000
export const CHECK_TIMEOUT_MAX_MS = 120_000
export const CHECK_TIMEOUT_DEFAULT_MS = 10_000

export const CHECK_ALL_CONCURRENCY_MIN = 2
export const CHECK_ALL_CONCURRENCY_MAX = 20
export const CHECK_ALL_CONCURRENCY_DEFAULT = 5

export const DOMAIN_CHECK_CONCURRENCY_MIN = 1
export const DOMAIN_CHECK_CONCURRENCY_MAX = 5
export const DOMAIN_CHECK_CONCURRENCY_DEFAULT = 1

export const AUTO_CHECK_INTERVAL_MIN = 1
export const AUTO_CHECK_INTERVAL_MAX = 1_440
export const AUTO_CHECK_INTERVAL_DEFAULT = 30

const EMPTY_AUTO_CHECK_GROUP_IDS: string[] = []

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  accentColor: ACCENT_COLOR_DEFAULT,
  language: 'en',
  checkDomains: [],
  checkTimeoutMs: CHECK_TIMEOUT_DEFAULT_MS,
  checkAllMode: 'sequential',
  checkAllConcurrency: CHECK_ALL_CONCURRENCY_DEFAULT,
  domainCheckConcurrency: DOMAIN_CHECK_CONCURRENCY_DEFAULT,
  fetchExternalIp: true,
  trayEnabled: false,
  startMinimized: false,
  launchAtLogin: false,
  autoCheckEnabled: false,
  autoCheckIntervalMinutes: AUTO_CHECK_INTERVAL_DEFAULT,
  autoCheckNotifications: true,
  autoCheckScope: 'all',
  autoCheckGroupIds: [],
  proxyCardView: 'standard',
  proxyDragEnabled: false,
  toastEnabled: true,
  toastPosition: 'top-right',
  proxyListView: DEFAULT_PROXY_LIST_VIEW,
  lastRoute: '/',
  logLevel: DEFAULT_LOG_LEVEL
}

export interface ProxyCheckOptions {
  checkDomains: string[]
  checkTimeoutMs: number
  checkAllConcurrency: number
  domainCheckConcurrency: number
  fetchExternalIp: boolean
}

function clampCheckAllConcurrency(value: number): number {
  return Math.min(CHECK_ALL_CONCURRENCY_MAX, Math.max(CHECK_ALL_CONCURRENCY_MIN, Math.round(value)))
}

function clampDomainCheckConcurrency(value: number): number {
  return Math.min(
    DOMAIN_CHECK_CONCURRENCY_MAX,
    Math.max(DOMAIN_CHECK_CONCURRENCY_MIN, Math.round(value))
  )
}

function clampAutoCheckIntervalMinutes(value: number): number {
  return Math.min(AUTO_CHECK_INTERVAL_MAX, Math.max(AUTO_CHECK_INTERVAL_MIN, Math.round(value)))
}

function normalizeAutoCheckScope(value: unknown): AutoCheckScope {
  if (value === 'favorites' || value === 'groups') {
    return value
  }

  return 'all'
}

function normalizeToastPosition(value: unknown): ToastPosition {
  if (
    value === 'top-left' ||
    value === 'top-center' ||
    value === 'top-right' ||
    value === 'bottom-left' ||
    value === 'bottom-center' ||
    value === 'bottom-right'
  ) {
    return value
  }

  return 'top-right'
}

function normalizeAccentColor(value: unknown): string {
  if (typeof value !== 'string') {
    return ACCENT_COLOR_DEFAULT
  }

  const normalized = value.toLowerCase()
  return ACCENT_COLOR_OPTIONS.some((option) => option.value === normalized)
    ? normalized
    : ACCENT_COLOR_DEFAULT
}

function normalizeLastRoute(value: unknown): AppRoute {
  if (value === '/settings' || value === '/providers') return value as AppRoute
  return '/'
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
    accentColor: normalizeAccentColor(merged.accentColor),
    checkDomains: normalizeCheckDomains(merged.checkDomains),
    checkAllMode: merged.checkAllMode === 'parallel' ? 'parallel' : 'sequential',
    checkAllConcurrency: clampCheckAllConcurrency(merged.checkAllConcurrency),
    domainCheckConcurrency: clampDomainCheckConcurrency(merged.domainCheckConcurrency),
    fetchExternalIp: merged.fetchExternalIp !== false,
    trayEnabled,
    startMinimized: trayEnabled && merged.startMinimized === true,
    launchAtLogin: merged.launchAtLogin === true,
    autoCheckEnabled: merged.autoCheckEnabled === true,
    autoCheckIntervalMinutes: clampAutoCheckIntervalMinutes(merged.autoCheckIntervalMinutes),
    autoCheckNotifications: merged.autoCheckNotifications !== false,
    autoCheckScope: normalizeAutoCheckScope(merged.autoCheckScope),
    autoCheckGroupIds:
      normalizeAutoCheckScope(merged.autoCheckScope) === 'groups'
        ? normalizeAutoCheckGroupIds(merged.autoCheckGroupIds)
        : EMPTY_AUTO_CHECK_GROUP_IDS,
    proxyCardView: merged.proxyCardView === 'compact' ? 'compact' : 'standard',
    proxyDragEnabled: merged.proxyDragEnabled === true,
    toastEnabled: merged.toastEnabled !== false,
    toastPosition: normalizeToastPosition(merged.toastPosition),
    proxyListView: normalizeProxyListView(merged.proxyListView),
    lastRoute: normalizeLastRoute(merged.lastRoute),
    logLevel: normalizeLogLevel(merged.logLevel)
  }
}
export function stripLocalOnlySettings(settings: AppSettings): SyncableAppSettings {
  const normalized = normalizeSettings(settings)
  const {
    lastRoute: _lastRoute,
    proxyListView: _proxyListView,
    launchAtLogin: _launchAtLogin,
    logLevel: _logLevel,
    ...syncable
  } = normalized
  return syncable
}

export function isSyncableSettingsEqual(a: AppSettings, b: AppSettings): boolean {
  return JSON.stringify(stripLocalOnlySettings(a)) === JSON.stringify(stripLocalOnlySettings(b))
}

export function applyImportedSettings(
  current: AppSettings,
  imported: Partial<SyncableAppSettings>,
  mode: 'merge' | 'replace'
): AppSettings {
  const merged =
    mode === 'replace'
      ? normalizeSettings(imported)
      : normalizeSettings({ ...current, ...imported })

  return {
    ...merged,
    lastRoute: current.lastRoute,
    proxyListView: current.proxyListView,
    launchAtLogin: current.launchAtLogin,
    logLevel: current.logLevel
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
