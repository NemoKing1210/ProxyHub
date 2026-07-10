import { alpha, type Theme } from '@mui/material/styles'
import { PROXY_COLOR_VALUES } from '../constants/proxy-colors'
import type { ProxyColorId } from '../types/proxy'
import { PROXY_COLOR_IDS, PROXY_ICON_IDS } from '../types/proxy'
import type { ProxyGroupInput } from '../types/proxy-group'

export function normalizeGroupIcon(value: string | undefined): ProxyGroupInput['icon'] {
  if (!value?.trim()) {
    return undefined
  }

  return PROXY_ICON_IDS.includes(value as (typeof PROXY_ICON_IDS)[number])
    ? (value as (typeof PROXY_ICON_IDS)[number])
    : undefined
}

export function normalizeGroupColor(value: string | undefined): ProxyGroupInput['color'] {
  if (!value?.trim()) {
    return undefined
  }

  return PROXY_COLOR_IDS.includes(value as ProxyColorId) ? (value as ProxyColorId) : undefined
}

export function normalizeGroupInput(input: {
  name: string
  icon?: string
  color?: string
}): ProxyGroupInput {
  return {
    name: input.name.trim(),
    icon: normalizeGroupIcon(input.icon),
    color: normalizeGroupColor(input.color)
  }
}

export function toGroupIconFormValue(icon: ProxyGroupInput['icon']): string {
  return icon ?? ''
}

export function toGroupColorFormValue(color: ProxyGroupInput['color']): string {
  return color ?? ''
}

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
