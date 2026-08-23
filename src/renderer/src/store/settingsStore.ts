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
import { notifySyncDataChange } from '../utils/sync-on-change'

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
  await window.api.saveSettings(next)

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

    try {
      const settings = normalizeSettings(await window.api.getSettings())
      applyLanguage(settings.language)
      set({ settings, isReady: true })
    } finally {
      set({ isLoading: false })
    }
  },

  setTheme: async (theme) => {
    await get().updateSettings({ theme })
  },

  setLanguage: async (language) => {
    await get().updateSettings({ language })
  },

  setCheckDomains: async (checkDomains) => {
    await get().updateSettings({ checkDomains })
  },

  setCheckTimeoutMs: async (checkTimeoutMs) => {
    await get().updateSettings({ checkTimeoutMs })
  },

  updateSettings: async (partial) => {
    const previous = get().settings
    const settings = normalizeSettings({ ...previous, ...partial })

    set({ settings })
    await persist(previous, settings)

    if (partial.language) {
      applyLanguage(partial.language)
    }
  },

  resetSettings: async () => {
    const previous = get().settings
    const settings = normalizeSettings(DEFAULT_SETTINGS)

    set({ settings })
    await persist(previous, settings)
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
