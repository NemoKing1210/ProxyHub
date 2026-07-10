import { create } from 'zustand'
import {
  DEFAULT_SETTINGS,
  normalizeSettings,
  RTL_LANGUAGES,
  type AppLanguage,
  type AppSettings,
  type ThemeMode
} from '../../../shared/types/settings'
import { setAppLanguage } from '../i18n'

interface SettingsState {
  settings: AppSettings
  isLoading: boolean
  isReady: boolean
  loadSettings: () => Promise<void>
  setTheme: (theme: ThemeMode) => Promise<void>
  setLanguage: (language: AppLanguage) => Promise<void>
  setCheckDomains: (checkDomains: string[]) => Promise<void>
  setCheckTimeoutMs: (checkTimeoutMs: number) => Promise<void>
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>
}

async function persist(settings: AppSettings): Promise<void> {
  await window.api.saveSettings(settings)
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
    const settings = normalizeSettings({ ...get().settings, ...partial })

    set({ settings })
    await persist(settings)

    if (partial.language) {
      applyLanguage(partial.language)
    }
  }
}))

export function useResolvedThemeMode(): 'light' | 'dark' {
  const theme = useSettingsStore((state) => state.settings.theme)

  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  return theme
}
