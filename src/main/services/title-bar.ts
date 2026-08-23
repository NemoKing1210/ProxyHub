import { nativeTheme, type BrowserWindow } from 'electron'
import type { ThemeMode } from '@shared/types/settings'
import { resolveColorScheme } from '@shared/theme/resolve-color-scheme'
import { getTitleBarTheme, type TitleBarTheme } from '@shared/theme/title-bar'
import { logger } from './logger'

const log = logger.scope('title-bar')

let activeThemeMode: ThemeMode = 'dark'

function resolveActiveColorScheme(): 'light' | 'dark' {
  return resolveColorScheme(activeThemeMode, nativeTheme.shouldUseDarkColors)
}

export function applyNativeThemeSource(mode: ThemeMode): void {
  log.debug('Applying native theme source', { mode })
  try {
    nativeTheme.themeSource = mode
    log.info('Native theme source applied', { mode })
  } catch (error) {
    log.error('Failed to apply native theme source', error)
    throw error
  }
}

export function resolveTitleBarTheme(mode: ThemeMode): TitleBarTheme {
  const theme = getTitleBarTheme(resolveColorScheme(mode, nativeTheme.shouldUseDarkColors))
  log.debug('Title bar theme resolved', { mode, color: theme.color })
  return theme
}

export function applyTitleBarTheme(window: BrowserWindow, theme: TitleBarTheme): void {
  if (process.platform !== 'win32') {
    log.debug('Skipping title bar theme apply (non-Windows)')
    return
  }

  try {
    log.debug('Applying title bar theme', { color: theme.color })
    window.setBackgroundColor(theme.color)
    log.info('Title bar theme applied', { color: theme.color })
  } catch (error) {
    log.error('Failed to apply title bar theme', error)
    throw error
  }
}

export function applyTitleBarThemeFromSettings(window: BrowserWindow, mode: ThemeMode): void {
  log.info('Applying title bar theme from settings', { mode })
  activeThemeMode = mode
  applyNativeThemeSource(mode)
  applyTitleBarTheme(window, resolveTitleBarTheme(mode))
}

export function syncTitleBarTheme(window: BrowserWindow, mode: ThemeMode): void {
  log.debug('Syncing title bar theme', { mode })
  applyTitleBarThemeFromSettings(window, mode)
}

export function handleNativeThemeUpdated(window: BrowserWindow | undefined): void {
  log.debug('Native theme updated', {
    activeThemeMode,
    shouldUseDark: nativeTheme.shouldUseDarkColors
  })
  if (!window || activeThemeMode !== 'system') {
    log.debug('Skipping native theme updated handling', {
      hasWindow: Boolean(window),
      activeThemeMode
    })
    return
  }

  try {
    applyTitleBarTheme(window, getTitleBarTheme(resolveActiveColorScheme()))
    log.info('Title bar updated for system theme change')
  } catch (error) {
    log.error('Failed to handle native theme update', error)
    throw error
  }
}

export function initializeNativeThemeListener(getWindow: () => BrowserWindow | undefined): void {
  log.info('Initializing native theme listener')
  nativeTheme.on('updated', () => {
    log.debug('nativeTheme updated event')
    handleNativeThemeUpdated(getWindow())
  })
}
