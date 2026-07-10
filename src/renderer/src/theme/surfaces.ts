import type { Theme } from '@mui/material/styles'
import { getPalette, withThemeAlpha } from './palette'

type SurfaceLevel = 'lowest' | 'low' | 'default' | 'high' | 'highest'

const SURFACE_OPACITY: Record<SurfaceLevel, number> = {
  lowest: 0.06,
  low: 0.1,
  default: 0.14,
  high: 0.18,
  highest: 0.24
}

export function surfaceContainer(theme: Theme, level: SurfaceLevel = 'default'): string {
  const palette = getPalette(theme)
  return withThemeAlpha(theme, palette.primary.main, SURFACE_OPACITY[level])
}

export function surfaceTint(
  theme: Theme,
  color: 'primary' | 'success' | 'error' | 'info' | 'warning' = 'primary',
  opacity?: number
): string {
  const palette = getPalette(theme)
  return withThemeAlpha(theme, palette[color].main, opacity ?? 0.16)
}

export function stateLayer(theme: Theme, opacity = 0.1): string {
  const palette = getPalette(theme)
  return withThemeAlpha(theme, palette.primary.main, opacity)
}

export function elevationShadow(theme: Theme, level: 1 | 2 | 3 = 1): string {
  const palette = getPalette(theme)

  const shadows: Record<1 | 2 | 3, string> = {
    1: `0 1px 2px ${withThemeAlpha(theme, palette.common.black, 0.28)}, 0 1px 3px ${withThemeAlpha(theme, palette.common.black, 0.14)}`,
    2: `0 4px 8px ${withThemeAlpha(theme, palette.common.black, 0.24)}, 0 2px 4px ${withThemeAlpha(theme, palette.common.black, 0.12)}`,
    3: `0 8px 24px ${withThemeAlpha(theme, palette.common.black, 0.32)}, 0 4px 12px ${withThemeAlpha(theme, palette.common.black, 0.16)}`
  }

  return shadows[level]
}

export function outlineVariant(theme: Theme): string {
  const palette = getPalette(theme)
  return withThemeAlpha(theme, palette.divider, 0.6)
}
