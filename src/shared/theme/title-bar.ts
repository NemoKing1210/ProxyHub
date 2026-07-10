export type ResolvedColorScheme = 'light' | 'dark'

export interface TitleBarTheme {
  color: string
  symbolColor: string
}

export const TITLE_BAR_HEIGHT = 32

const TITLE_BAR_THEMES: Record<ResolvedColorScheme, TitleBarTheme> = {
  light: {
    color: '#eef1f8',
    symbolColor: '#1a1d27'
  },
  dark: {
    color: '#0a0e1a',
    symbolColor: '#e8ecf4'
  }
}

export function getTitleBarTheme(scheme: ResolvedColorScheme): TitleBarTheme {
  return TITLE_BAR_THEMES[scheme]
}
