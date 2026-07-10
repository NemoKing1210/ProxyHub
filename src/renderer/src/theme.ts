import { alpha, createTheme, type Theme } from '@mui/material/styles'
import type { ThemeMode } from '../../shared/types/settings'

export function resolveThemeMode(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  return mode
}

export function createAppTheme(mode: 'light' | 'dark', direction: 'ltr' | 'rtl' = 'ltr'): Theme {
  return createTheme({
    direction,
    palette: {
      mode,
      primary: {
        main: '#5c8aff'
      },
      secondary: {
        main: '#7c93ee'
      },
      ...(mode === 'dark'
        ? {
            background: {
              default: '#0f1117',
              paper: '#1a1d27'
            }
          }
        : {
            background: {
              default: '#f4f6fb',
              paper: '#ffffff'
            }
          })
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
    },
    shape: {
      borderRadius: 10
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: (theme) => {
          const track = theme.palette.background.default
          const thumb = alpha(
            theme.palette.text.primary,
            theme.palette.mode === 'dark' ? 0.22 : 0.28
          )
          const thumbHover = alpha(
            theme.palette.text.primary,
            theme.palette.mode === 'dark' ? 0.34 : 0.4
          )

          return {
            html: {
              colorScheme: theme.palette.mode
            },
            body: {
              userSelect: 'none',
              scrollbarColor: `${thumb} ${track}`
            },
            '*': {
              scrollbarWidth: 'thin'
            },
            '*::-webkit-scrollbar': {
              width: 10,
              height: 10
            },
            '*::-webkit-scrollbar-track': {
              backgroundColor: track
            },
            '*::-webkit-scrollbar-thumb': {
              backgroundColor: thumb,
              borderRadius: 999,
              border: `2px solid ${track}`
            },
            '*::-webkit-scrollbar-thumb:hover': {
              backgroundColor: thumbHover
            },
            '*::-webkit-scrollbar-corner': {
              backgroundColor: track
            }
          }
        }
      }
    }
  })
}
