export type ThemeMode = 'light' | 'dark' | 'system'

export type AppLanguage = 'en' | 'zh' | 'hi' | 'es' | 'fr' | 'ar' | 'pt' | 'ru' | 'ja' | 'de'

export interface AppSettings {
  theme: ThemeMode
  language: AppLanguage
  checkDomains: string[]
  checkTimeoutMs: number
}

export const CHECK_TIMEOUT_MIN_MS = 1_000
export const CHECK_TIMEOUT_MAX_MS = 120_000
export const CHECK_TIMEOUT_DEFAULT_MS = 10_000

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  language: 'en',
  checkDomains: ['google.com'],
  checkTimeoutMs: CHECK_TIMEOUT_DEFAULT_MS
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
