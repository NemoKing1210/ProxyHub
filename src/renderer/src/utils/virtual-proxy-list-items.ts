import type { ProxyGroup } from '../../../shared/types/proxy-group'
import type { OrganizedProxyList, ProxyGroupSection } from './organize-proxies-by-group'

export type VirtualProxyListItem =
  | { type: 'ungrouped-empty'; key: string }
  | {
      type: 'group-header'
      key: string
      group: ProxyGroup
      proxyCount: number
      deadProxyCount: number
    }
  | { type: 'proxy'; key: string; proxyId: string; groupId?: string }

export function buildVirtualProxyListItems(
  organizedList: OrganizedProxyList,
  visibleGroupSections: ProxyGroupSection[],
  showUngroupedDropZone: boolean,
  getGroupDeadProxyCount: (groupId: string) => number
): VirtualProxyListItem[] {
  const items: VirtualProxyListItem[] = []

  if (showUngroupedDropZone) {
    if (organizedList.ungrouped.length === 0) {
      items.push({ type: 'ungrouped-empty', key: 'ungrouped-empty' })
    }

    for (const proxy of organizedList.ungrouped) {
      items.push({ type: 'proxy', key: proxy.id, proxyId: proxy.id })
    }
  }

  for (const section of visibleGroupSections) {
    items.push({
      type: 'group-header',
      key: `group-${section.group.id}`,
      group: section.group,
      proxyCount: section.proxies.length,
      deadProxyCount: getGroupDeadProxyCount(section.group.id)
    })

    for (const proxy of section.proxies) {
      items.push({
        type: 'proxy',
        key: proxy.id,
        proxyId: proxy.id,
        groupId: section.group.id
      })
    }
  }

  return items
}

export const PROXY_LIST_VIRTUALIZATION_THRESHOLD = 80

export function estimateVirtualItemSize(
  item: VirtualProxyListItem,
  proxyCardView: 'standard' | 'compact'
): number {
  if (item.type === 'group-header') {
    return 72
  }

  if (item.type === 'ungrouped-empty') {
    return 56
  }

  return proxyCardView === 'compact' ? 96 : 168
}
