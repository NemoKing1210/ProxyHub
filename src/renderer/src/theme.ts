import {
  alpha,
  createTheme,
  darken,
  getContrastRatio,
  lighten,
  type Theme
} from '@mui/material/styles'
import type { ThemeMode } from '@shared/types/settings'
import { ACCENT_COLOR_DEFAULT } from '@shared/types/settings'
import { resolveColorScheme } from '@shared/theme/resolve-color-scheme'
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
export {
  MD3_DURATION,
  MD3_EASING,
  MD3_EASING_CURVES,
  staggerDelay,
  surfaceTransition
} from './theme/motion'

function withAlpha(
  theme: { vars?: Theme['vars']; palette: Theme['palette'] },
  color: string,
  value: number | string
): string {
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

// App-wide border-radius scale:
//   8px  — small elements: chips, tooltips, small inline blocks
//   12px — controls and inner blocks: fields, switch cards, icons, nested boxes
//   16px — cards and containers: proxy cards, sections, filters/search,
//          dialogs, menus, popovers (incl. outer corners of stitched lists)
//   Pills (999px) and circles (50%) — capsule buttons, avatars, progress tracks.
const sharedShape = {
  borderRadius: 12
}

// Mix two hex colors (sRGB lerp) for accent-tinted tonal surfaces.
function mixColor(base: string, accent: string, weight: number): string {
  const parse = (hex: string): [number, number, number] => {
    const value = hex.replace('#', '')
    const full =
      value.length === 3
        ? value
            .split('')
            .map((ch) => ch + ch)
            .join('')
        : value
    const num = parseInt(full, 16)
    return [(num >> 16) & 0xff, (num >> 8) & 0xff, num & 0xff]
  }

  const [r1, g1, b1] = parse(base)
  const [r2, g2, b2] = parse(accent)
  const channel = (a: number, b: number): number =>
    Math.round(a + (b - a) * Math.min(Math.max(weight, 0), 1))

  const toHex = (n: number): string => n.toString(16).padStart(2, '0')
  return `#${toHex(channel(r1, r2))}${toHex(channel(g1, g2))}${toHex(channel(b1, b2))}`
}

// MD3 tonal backgrounds: neutral base tinted with the accent. The app and
// paper backgrounds blend in the accent while card/section surfaces are built
// on top via surfaceContainer, forming a cohesive accent ladder.
function tonalBackgrounds(accent: string): {
  light: { default: string; paper: string }
  dark: { default: string; paper: string }
} {
  return {
    light: {
      default: mixColor('#eef1f8', accent, 0.07),
      paper: mixColor('#ffffff', accent, 0.035)
    },
    dark: {
      default: mixColor('#0a0e1a', accent, 0.09),
      paper: mixColor('#141824', accent, 0.06)
    }
  }
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

function getPrimaryPalette(accentColor: string): {
  main: string
  light: string
  dark: string
  contrastText: string
} {
  const contrastText = getContrastRatio(accentColor, '#ffffff') >= 3 ? '#ffffff' : '#0a0e1a'

  return {
    main: accentColor,
    light: lighten(accentColor, 0.24),
    dark: darken(accentColor, 0.24),
    contrastText
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
          borderRadius: 16,
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
            : {}),
          ...(ownerState.variant === 'filled' && ownerState.severity === 'warning'
            ? {
                boxShadow: `0 4px 16px ${withAlpha(theme, getPalette(theme).warning.main, 0.35)}`
              }
            : {}),
          ...(ownerState.variant === 'filled' && ownerState.severity === 'error'
            ? {
                boxShadow: `0 4px 16px ${withAlpha(theme, getPalette(theme).error.main, 0.3)}`
              }
            : {})
        })
      }
    },
    MuiSnackbar: {
      styleOverrides: {
        root: {
          // Scope to bottom anchors only: a global `bottom` would also apply
          // to top-anchored snackbars, stretching them across the viewport.
          [`&.MuiSnackbar-anchorOriginBottomLeft, &.MuiSnackbar-anchorOriginBottomCenter,
            &.MuiSnackbar-anchorOriginBottomRight`]: {
            bottom: 24
          }
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
    MuiMenu: {
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

export function createAppTheme(
  direction: 'ltr' | 'rtl' = 'ltr',
  accentColor = ACCENT_COLOR_DEFAULT
): Theme {
  const primary = getPrimaryPalette(accentColor)
  const tonal = tonalBackgrounds(primary.main)

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
          primary,
          secondary: {
            main: '#5c6bc0',
            light: '#8e99f3',
            dark: '#3f4a8a',
            contrastText: '#ffffff'
          },
          background: {
            default: tonal.light.default,
            paper: tonal.light.paper
          },
          divider: alpha(primary.main, 0.12),
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
          primary,
          secondary: {
            main: '#7c93ee',
            light: '#a8b8ff',
            dark: '#5568b8',
            contrastText: '#0a0e1a'
          },
          background: {
            default: tonal.dark.default,
            paper: tonal.dark.paper
          },
          divider: alpha(primary.main, 0.14),
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
