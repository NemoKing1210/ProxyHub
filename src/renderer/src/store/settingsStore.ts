import { create } from 'zustand'
import {
  DEFAULT_SETTINGS,
  isSyncableSettingsEqual,
  normalizeSettings,
  RTL_LANGUAGES,
  type AppLanguage,
  type AppSettings,
  type CheckDomainEntry,
  type ThemeMode
} from '@shared/types/settings'
import { setAppLanguage } from '../i18n'
import { notifySyncDataChange } from '../services/sync-on-change'
import { logger } from '../lib/renderer-logger'

const settingsLogger = logger.scope('settings-store')
interface SettingsState {
  settings: AppSettings
  isLoading: boolean
  isReady: boolean
  loadSettings: () => Promise<void>
  setTheme: (theme: ThemeMode) => Promise<void>
  setLanguage: (language: AppLanguage) => Promise<void>
  setCheckDomains: (checkDomains: CheckDomainEntry[]) => Promise<void>
  setCheckTimeoutMs: (checkTimeoutMs: number) => Promise<void>
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>
  resetSettings: () => Promise<void>
}

async function persist(previous: AppSettings, next: AppSettings): Promise<void> {
  settingsLogger.debug('Persisting settings', {
    changed: Object.keys(next).filter(
      (k) =>
        (previous as unknown as Record<string, unknown>)[k] !==
        (next as unknown as Record<string, unknown>)[k]
    )
  })
  try {
    await window.api.saveSettings(next)
    settingsLogger.info('Settings persisted')
  } catch (error) {
    settingsLogger.error('Failed to persist settings', error)
    throw error
  }

  if (!isSyncableSettingsEqual(previous, next)) {
    notifySyncDataChange('settings')
  }
}

function applyLanguage(language: AppLanguage): void {
  setAppLanguage(language)
  document.documentElement.lang = language
  document.documentElement.dir = RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr'
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoading: true,
  isReady: false,

  loadSettings: async () => {
    set({ isLoading: true })
    settingsLogger.debug('Loading settings')

    try {
      const settings = normalizeSettings(await window.api.getSettings())
      applyLanguage(settings.language)
      set({ settings, isReady: true })
      settingsLogger.info('Settings loaded', { logLevel: settings.logLevel })
    } catch (error) {
      settingsLogger.error('Failed to load settings', error)
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  setTheme: async (theme) => {
    settingsLogger.info('Setting theme', { theme })
    try {
      await get().updateSettings({ theme })
    } catch (error) {
      settingsLogger.error('Failed to set theme', { theme, error })
      throw error
    }
  },

  setLanguage: async (language) => {
    settingsLogger.info('Setting language', { language })
    try {
      await get().updateSettings({ language })
    } catch (error) {
      settingsLogger.error('Failed to set language', { language, error })
      throw error
    }
  },

  setCheckDomains: async (checkDomains) => {
    settingsLogger.info('Setting check domains', { count: checkDomains.length })
    try {
      await get().updateSettings({ checkDomains })
    } catch (error) {
      settingsLogger.error('Failed to set check domains', error)
      throw error
    }
  },

  setCheckTimeoutMs: async (checkTimeoutMs) => {
    settingsLogger.info('Setting check timeout', { checkTimeoutMs })
    try {
      await get().updateSettings({ checkTimeoutMs })
    } catch (error) {
      settingsLogger.error('Failed to set check timeout', { checkTimeoutMs, error })
      throw error
    }
  },

  updateSettings: async (partial) => {
    const previous = get().settings
    const settings = normalizeSettings({ ...previous, ...partial })
    settingsLogger.info('Updating settings', { partial, logLevel: settings.logLevel })

    set({ settings })
    try {
      await persist(previous, settings)
    } catch (error) {
      settingsLogger.error('Failed to update settings', { partial, error })
      throw error
    }

    if (partial.language) {
      applyLanguage(partial.language)
    }
  },

  resetSettings: async () => {
    settingsLogger.info('Resetting settings to defaults')
    const previous = get().settings
    const settings = normalizeSettings(DEFAULT_SETTINGS)

    set({ settings })
    try {
      await persist(previous, settings)
    } catch (error) {
      settingsLogger.error('Failed to reset settings', error)
      throw error
    }
    applyLanguage(settings.language)
  }
}))

export function useResolvedThemeMode(): 'light' | 'dark' {
  const theme = useSettingsStore((state) => state.settings.theme)

  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  return theme
}
