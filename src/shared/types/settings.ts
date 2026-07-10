export type ThemeMode = 'light' | 'dark' | 'system'

export type AppLanguage = 'en' | 'zh' | 'hi' | 'es' | 'fr' | 'ar' | 'pt' | 'ru' | 'ja' | 'de'

export type CheckAllMode = 'sequential' | 'parallel'

export interface AppSettings {
  theme: ThemeMode
  language: AppLanguage
  checkDomains: string[]
  checkTimeoutMs: number
  checkAllMode: CheckAllMode
  checkAllConcurrency: number
}

export const CHECK_TIMEOUT_MIN_MS = 1_000
export const CHECK_TIMEOUT_MAX_MS = 120_000
export const CHECK_TIMEOUT_DEFAULT_MS = 10_000

export const CHECK_ALL_CONCURRENCY_MIN = 2
export const CHECK_ALL_CONCURRENCY_MAX = 20
export const CHECK_ALL_CONCURRENCY_DEFAULT = 5

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  language: 'en',
  checkDomains: [],
  checkTimeoutMs: CHECK_TIMEOUT_DEFAULT_MS,
  checkAllMode: 'sequential',
  checkAllConcurrency: CHECK_ALL_CONCURRENCY_DEFAULT
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

export function normalizeSettings(settings: Partial<AppSettings> | undefined): AppSettings {
  const merged = { ...DEFAULT_SETTINGS, ...(settings ?? {}) }

  return {
    ...merged,
    checkDomains: Array.isArray(merged.checkDomains)
      ? merged.checkDomains.map((domain) => domain.trim()).filter(Boolean)
      : [],
    checkAllMode: merged.checkAllMode === 'parallel' ? 'parallel' : 'sequential',
    checkAllConcurrency: clampCheckAllConcurrency(merged.checkAllConcurrency)
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
  { code: 'ja', label: '日本語', countryCode: 'JP' },
  { code: 'de', label: 'Deutsch', countryCode: 'DE' }
]

export const RTL_LANGUAGES: AppLanguage[] = ['ar']
