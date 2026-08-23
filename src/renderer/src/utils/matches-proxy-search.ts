import type { Proxy } from '@shared/types/proxy'

export function matchesProxySearch(
  proxy: Proxy,
  query: string,
  groupNameById: Map<string, string>
): boolean {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) {
    return true
  }

  const label = proxy.label?.toLowerCase() ?? ''
  const host = proxy.host.toLowerCase()
  const protocol = proxy.protocol.toLowerCase()
  const groupName = proxy.groupId ? (groupNameById.get(proxy.groupId)?.toLowerCase() ?? '') : ''

  return (
    label.includes(normalizedQuery) ||
    host.includes(normalizedQuery) ||
    protocol.includes(normalizedQuery) ||
    groupName.includes(normalizedQuery)
  )
}
