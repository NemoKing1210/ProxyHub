export type ResolvedColorScheme = 'light' | 'dark'

export interface TitleBarTheme {
  color: string
}

export const TITLE_BAR_HEIGHT = 48

const TITLE_BAR_THEMES: Record<ResolvedColorScheme, TitleBarTheme> = {
  light: {
    color: '#eef1f8'
  },
  dark: {
    color: '#0a0e1a'
  }
}

export function getTitleBarTheme(scheme: ResolvedColorScheme): TitleBarTheme {
  return TITLE_BAR_THEMES[scheme]
}
