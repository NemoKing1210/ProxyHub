import { alpha, createTheme, type Theme } from '@mui/material/styles'
import type { ThemeMode } from '../../shared/types/settings'
import { resolveColorScheme } from '../../shared/theme/resolve-color-scheme'
import { getPalette, withThemeAlpha } from './theme/palette'
import { MD3_DURATION, MD3_EASING } from './theme/motion'

export {
  surfaceContainer,
  surfaceTint,
  stateLayer,
  elevationShadow,
  outlineVariant
} from './theme/surfaces'
export { getPalette, withThemeAlpha } from './theme/palette'
export { MD3_DURATION, MD3_EASING, staggerDelay } from './theme/motion'

function withAlpha(theme: { vars?: Theme['vars']; palette: Theme['palette'] }, color: string, value: number | string): string {
  return withThemeAlpha(theme, color, value)
}

export function resolveThemeMode(mode: ThemeMode): 'light' | 'dark' {
  return resolveColorScheme(mode, window.matchMedia('(prefers-color-scheme: dark)').matches)
}

const sharedTypography = {
  fontFamily: '"Roboto Flex Variable", "Roboto", "Helvetica", "Arial", sans-serif',
  h4: { fontWeight: 700, letterSpacing: '-0.02em' },
  h5: { fontWeight: 700, letterSpacing: '-0.015em' },
  h6: { fontWeight: 600, letterSpacing: '-0.01em' },
  subtitle1: { fontWeight: 600 },
  subtitle2: { fontWeight: 600, letterSpacing: '0.01em' },
  button: { fontWeight: 600, letterSpacing: '0.02em' }
}

const sharedShape = {
  borderRadius: 12
}

const sharedTransitions = {
  easing: {
    easeInOut: MD3_EASING.standard,
    easeOut: MD3_EASING.emphasizedDecelerate,
    easeIn: MD3_EASING.emphasizedAccelerate,
    sharp: MD3_EASING.emphasizedAccelerate
  },
  duration: {
    shortest: MD3_DURATION.short2,
    shorter: MD3_DURATION.short4,
    short: MD3_DURATION.medium1,
    standard: MD3_DURATION.medium2,
    complex: MD3_DURATION.medium4,
    enteringScreen: MD3_DURATION.medium3,
    leavingScreen: MD3_DURATION.medium1
  }
}

function buildComponentOverrides(): Theme['components'] {
  return {
    MuiCssBaseline: {
      styleOverrides: (theme) => {
        const palette = getPalette(theme)
        const track = palette.background.default
        const thumb = withAlpha(theme, palette.text.primary, 0.28)
        const thumbHover = withAlpha(theme, palette.text.primary, 0.42)

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
          },
          '@media (prefers-reduced-motion: reduce)': {
            '*, *::before, *::after': {
              animationDuration: '0.01ms !important',
              animationIterationCount: '1 !important',
              transitionDuration: '0.01ms !important'
            }
          }
        }
      }
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 20,
          fontWeight: 600,
          paddingInline: 20,
          transition: `background-color ${MD3_DURATION.short4}ms ${MD3_EASING.standard}, box-shadow ${MD3_DURATION.short4}ms ${MD3_EASING.standard}, transform ${MD3_DURATION.short3}ms ${MD3_EASING.standard}`,
          '&:active': {
            transform: 'scale(0.98)'
          }
        },
        sizeSmall: {
          borderRadius: 16,
          paddingInline: 14,
          fontSize: '0.8125rem'
        },
        contained: ({ theme }) => ({
          boxShadow: 'none',
          '&:hover': {
            boxShadow: `0 2px 8px ${withAlpha(theme, getPalette(theme).primary.main, 0.35)}`
          }
        }),
        outlined: ({ theme }) => {
          const palette = getPalette(theme)
          return {
            borderWidth: 1,
            borderColor: withAlpha(theme, palette.divider, 0.5),
            '&:hover': {
              borderWidth: 1,
              backgroundColor: withAlpha(theme, palette.primary.main, 0.08)
            }
          }
        },
        text: ({ theme }) => {
          const palette = getPalette(theme)
          return {
            '&:hover': {
              backgroundColor: withAlpha(theme, palette.primary.main, 0.08)
            }
          }
        }
      }
    },
    MuiIconButton: {
      styleOverrides: {
        root: ({ theme }) => {
          const palette = getPalette(theme)
          return {
            borderRadius: 12,
            transition: `background-color ${MD3_DURATION.short4}ms ${MD3_EASING.standard}, transform ${MD3_DURATION.short3}ms ${MD3_EASING.standard}`,
            '&:hover': {
              backgroundColor: withAlpha(theme, palette.primary.main, 0.1)
            },
            '&:active': {
              transform: 'scale(0.94)'
            }
          }
        }
      }
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0
      },
      styleOverrides: {
        root: () => ({
          backgroundImage: 'none',
          border: 'none'
        }),
        rounded: {
          borderRadius: 16
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 8
        },
        sizeSmall: {
          height: 26,
          fontSize: '0.75rem'
        },
        outlined: ({ theme }) => ({
          borderColor: withAlpha(theme, getPalette(theme).divider, 0.7)
        })
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 28,
          padding: 4
        }
      }
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          fontSize: '1.375rem',
          paddingBottom: 8
        }
      }
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined'
      },
      styleOverrides: {
        root: ({ theme }) => ({
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            transition: `box-shadow ${MD3_DURATION.short4}ms ${MD3_EASING.standard}`,
            '&.Mui-focused': {
              boxShadow: `0 0 0 3px ${withAlpha(theme, getPalette(theme).primary.main, 0.2)}`
            }
          }
        })
      }
    },
    MuiSlider: {
      styleOverrides: {
        root: ({ theme }) => ({
          '& .MuiSlider-thumb': {
            width: 20,
            height: 20,
            transition: `box-shadow ${MD3_DURATION.short4}ms ${MD3_EASING.standard}`,
            '&:hover, &.Mui-focusVisible': {
              boxShadow: `0 0 0 8px ${withAlpha(theme, getPalette(theme).primary.main, 0.16)}`
            }
          },
          '& .MuiSlider-track': {
            height: 6,
            borderRadius: 3
          },
          '& .MuiSlider-rail': {
            height: 6,
            borderRadius: 3,
            opacity: theme.palette.mode === 'dark' ? 0.28 : 0.2
          }
        })
      }
    },
    MuiToggleButton: {
      styleOverrides: {
        root: ({ theme }) => {
          const palette = getPalette(theme)

          return {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 12,
            border: 'none',
            color: palette.text.secondary,
            transition: `background-color ${MD3_DURATION.short4}ms ${MD3_EASING.standard}, color ${MD3_DURATION.short4}ms ${MD3_EASING.standard}`,
            '& .MuiSvgIcon-root': {
              color: 'inherit'
            },
            '&.Mui-selected': {
              backgroundColor: withAlpha(theme, palette.primary.main, 0.2),
              color: palette.primary.main,
              '&:hover': {
                backgroundColor: withAlpha(theme, palette.primary.main, 0.26)
              }
            },
            '&:hover': {
              backgroundColor: withAlpha(theme, palette.primary.main, 0.08),
              color: palette.text.primary
            }
          }
        }
      }
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: ({ theme }) => {
          const palette = getPalette(theme)

          return {
            gap: 4,
            padding: 4,
            borderRadius: 16,
            backgroundColor: withAlpha(theme, palette.primary.main, 0.08),
            border: `1px solid ${withAlpha(theme, palette.primary.main, 0.14)}`,
            '& .MuiToggleButtonGroup-grouped': {
              border: 0,
              borderRadius: '12px !important',
              margin: 0
            }
          }
        }
      }
    },
    MuiAlert: {
      styleOverrides: {
        root: ({ theme, ownerState }) => ({
          borderRadius: 16,
          fontWeight: 500,
          ...(ownerState.variant === 'filled' && ownerState.severity === 'success'
            ? {
                boxShadow: `0 4px 16px ${withAlpha(theme, getPalette(theme).success.main, 0.35)}`
              }
            : {})
        })
      }
    },
    MuiSnackbar: {
      styleOverrides: {
        root: {
          bottom: 24
        }
      }
    },
    MuiCollapse: {
      styleOverrides: {
        wrapperInner: {
          transitionTimingFunction: MD3_EASING.emphasizedDecelerate
        }
      }
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          borderRadius: 16
        }
      }
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
          fontSize: '0.75rem',
          fontWeight: 500
        }
      }
    }
  }
}

export function createAppTheme(direction: 'ltr' | 'rtl' = 'ltr'): Theme {
  return createTheme({
    direction,
    cssVariables: {
      colorSchemeSelector: 'data'
    },
    colorSchemes: {
      light: {
        palette: {
          text: {
            primary: '#1a1d27',
            secondary: 'rgba(26, 29, 39, 0.68)'
          },
          primary: {
            main: '#3d5fc9',
            light: '#5c8aff',
            dark: '#2a4499',
            contrastText: '#ffffff'
          },
          secondary: {
            main: '#5c6bc0',
            light: '#8e99f3',
            dark: '#3f4a8a',
            contrastText: '#ffffff'
          },
          background: {
            default: '#eef1f8',
            paper: '#ffffff'
          },
          divider: alpha('#3d5fc9', 0.12),
          success: { main: '#1b873f' },
          error: { main: '#ba1a1a' },
          warning: { main: '#8a5000' },
          info: { main: '#0061a4' }
        }
      },
      dark: {
        palette: {
          text: {
            primary: '#e8ecf4',
            secondary: 'rgba(232, 236, 244, 0.72)'
          },
          primary: {
            main: '#5c8aff',
            light: '#8ba8ff',
            dark: '#3d6de0',
            contrastText: '#0a0e1a'
          },
          secondary: {
            main: '#7c93ee',
            light: '#a8b8ff',
            dark: '#5568b8',
            contrastText: '#0a0e1a'
          },
          background: {
            default: '#0a0e1a',
            paper: '#141824'
          },
          divider: alpha('#5c8aff', 0.14),
          success: { main: '#4cd964' },
          error: { main: '#ff6b6b' },
          warning: { main: '#ffb74d' },
          info: { main: '#64b5f6' }
        }
      }
    },
    typography: sharedTypography,
    shape: sharedShape,
    transitions: sharedTransitions,
    components: buildComponentOverrides()
  })
}
