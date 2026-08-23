import type { Proxy } from '@shared/types/proxy'
import type { ProxyGroup } from '@shared/types/proxy-group'

export interface ProxyGroupSection {
  group: ProxyGroup
  proxies: Proxy[]
}

export interface OrganizedProxyList {
  ungrouped: Proxy[]
  groups: ProxyGroupSection[]
}

export function organizeProxiesByGroup(proxies: Proxy[], groups: ProxyGroup[]): OrganizedProxyList {
  const groupIds = new Set(groups.map((group) => group.id))
  const byGroupId = new Map<string, Proxy[]>()

  for (const group of groups) {
    byGroupId.set(group.id, [])
  }

  const ungrouped: Proxy[] = []

  for (const proxy of proxies) {
    if (!proxy.groupId || !groupIds.has(proxy.groupId)) {
      ungrouped.push(proxy)
      continue
    }

    byGroupId.get(proxy.groupId)?.push(proxy)
  }

  const sortedGroups = [...groups].sort((left, right) =>
    left.name.localeCompare(right.name, undefined, { sensitivity: 'base' })
  )

  return {
    ungrouped,
    groups: sortedGroups.map((group) => ({
      group,
      proxies: byGroupId.get(group.id) ?? []
    }))
  }
}
