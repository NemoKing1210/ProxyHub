import type { Proxy } from '../../../shared/types/proxy'
import type { ProxyGroup } from '../../../shared/types/proxy-group'

export const UNGROUPED_DROP_ZONE_ID = 'ungrouped' as const

export function getGroupDropZoneId(groupId: string): string {
  return `group:${groupId}`
}

export function isGroupDropZoneId(id: string): boolean {
  return id.startsWith('group:')
}

export function parseGroupDropZoneId(id: string): string | undefined {
  if (!isGroupDropZoneId(id)) {
    return undefined
  }

  return id.slice('group:'.length)
}

export function resolveDropTargetGroupId(
  overId: string | number | undefined,
  proxies: Proxy[],
  groups: ProxyGroup[]
): string | undefined | null {
  if (overId === undefined || overId === null) {
    return null
  }

  const id = String(overId)

  if (id === UNGROUPED_DROP_ZONE_ID) {
    return undefined
  }

  const groupId = parseGroupDropZoneId(id)
  if (groupId !== undefined) {
    return groups.some((group) => group.id === groupId) ? groupId : null
  }

  const proxy = proxies.find((item) => item.id === id)
  if (proxy) {
    return proxy.groupId
  }

  return null
}

export function groupsMatch(
  currentGroupId: string | undefined,
  targetGroupId: string | undefined
): boolean {
  return (currentGroupId ?? null) === (targetGroupId ?? null)
}

export function isHoveringGroup(
  hoveredId: string | null,
  groupId: string,
  sectionProxyIds: string[]
): boolean {
  if (!hoveredId) {
    return false
  }

  if (hoveredId === getGroupDropZoneId(groupId)) {
    return true
  }

  return sectionProxyIds.includes(hoveredId)
}
