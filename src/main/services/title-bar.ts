import { nativeTheme, type BrowserWindow } from 'electron'
import type { ThemeMode } from '../../shared/types/settings'
import { resolveColorScheme } from '../../shared/theme/resolve-color-scheme'
import { getTitleBarTheme, type TitleBarTheme } from '../../shared/theme/title-bar'

let activeThemeMode: ThemeMode = 'dark'

function resolveActiveColorScheme(): 'light' | 'dark' {
  return resolveColorScheme(activeThemeMode, nativeTheme.shouldUseDarkColors)
}

export function applyNativeThemeSource(mode: ThemeMode): void {
  nativeTheme.themeSource = mode
}

export function resolveTitleBarTheme(mode: ThemeMode): TitleBarTheme {
  return getTitleBarTheme(resolveColorScheme(mode, nativeTheme.shouldUseDarkColors))
}

export function applyTitleBarTheme(window: BrowserWindow, theme: TitleBarTheme): void {
  if (process.platform !== 'win32') {
    return
  }

  window.setBackgroundColor(theme.color)
}

export function applyTitleBarThemeFromSettings(window: BrowserWindow, mode: ThemeMode): void {
  activeThemeMode = mode
  applyNativeThemeSource(mode)
  applyTitleBarTheme(window, resolveTitleBarTheme(mode))
}

export function syncTitleBarTheme(window: BrowserWindow, mode: ThemeMode): void {
  applyTitleBarThemeFromSettings(window, mode)
}

export function handleNativeThemeUpdated(window: BrowserWindow | undefined): void {
  if (!window || activeThemeMode !== 'system') {
    return
  }

  applyTitleBarTheme(window, getTitleBarTheme(resolveActiveColorScheme()))
}

export function initializeNativeThemeListener(getWindow: () => BrowserWindow | undefined): void {
  nativeTheme.on('updated', () => {
    handleNativeThemeUpdated(getWindow())
  })
}
