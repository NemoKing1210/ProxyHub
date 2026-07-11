import { alpha, type Theme } from '@mui/material/styles'
import { PROXY_COLOR_VALUES } from '../../../shared/constants/proxy-colors'
import type { ProxyColorId } from '../../../shared/types/proxy'

export interface GroupColorStyles {
  main: string
  surface: string
  accent: string
  ring: string
}

export function getGroupColorStyles(theme: Theme, colorId?: ProxyColorId): GroupColorStyles {
  const main = colorId ? PROXY_COLOR_VALUES[colorId] : theme.palette.primary.main
  const isDark = theme.palette.mode === 'dark'

  return {
    main,
    surface: alpha(main, isDark ? 0.12 : 0.07),
    accent: alpha(main, isDark ? 0.24 : 0.14),
    ring: alpha(main, 0.35)
  }
}
