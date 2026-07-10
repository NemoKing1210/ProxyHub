import type { ProxyGroup } from '../types/proxy-group'

export function normalizeGroupName(name: string): string {
  return name.trim().toLowerCase()
}

export function findDuplicateGroupName(
  name: string,
  existing: ProxyGroup[],
  excludeId?: string
): ProxyGroup | undefined {
  const normalized = normalizeGroupName(name)

  if (!normalized) {
    return undefined
  }

  return existing.find((group) => {
    if (excludeId && group.id === excludeId) {
      return false
    }

    return normalizeGroupName(group.name) === normalized
  })
}
