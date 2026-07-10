import type { ThemeMode } from '../types/settings'
import type { ResolvedColorScheme } from './title-bar'

export function resolveColorScheme(mode: ThemeMode, prefersDark = false): ResolvedColorScheme {
  if (mode === 'system') {
    return prefersDark ? 'dark' : 'light'
  }

  return mode
}
