import type { ProxyColorId, ProxyIconId } from './proxy'
import { PROXY_ICON_IDS } from './proxy'

export interface ProxyGroup {
  id: string
  name: string
  icon?: ProxyIconId
  color?: ProxyColorId
  createdAt: string
}

export interface ProxyGroupInput {
  name: string
  icon?: ProxyIconId
  color?: ProxyColorId
}

export const GROUP_ICON_FORM_VALUES = ['', ...PROXY_ICON_IDS] as const

export type GroupIconFormValue = (typeof GROUP_ICON_FORM_VALUES)[number]
