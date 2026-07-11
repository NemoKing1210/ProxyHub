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
