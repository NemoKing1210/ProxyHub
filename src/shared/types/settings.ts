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

export const SUPPORTED_LANGUAGES: { code: AppLanguage; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'ar', label: 'العربية' },
  { code: 'pt', label: 'Português' },
  { code: 'ru', label: 'Русский' },
  { code: 'ja', label: '日本語' },
  { code: 'de', label: 'Deutsch' }
]

export const RTL_LANGUAGES: AppLanguage[] = ['ar']
