import type { Proxy } from '../../../shared/types/proxy'

export interface ProxyCheckProgress {
  completed: number
  total: number
  value: number
}

export function getProxyCheckProgress(
  proxies: Proxy[],
  checkingIds: Set<string>
): ProxyCheckProgress | null {
  let total = 0
  let completed = 0

  for (const proxy of proxies) {
    if (!checkingIds.has(proxy.id)) {
      continue
    }

    total += 1

    if (proxy.checkedAt) {
      completed += 1
    }
  }

  if (total === 0) {
    return null
  }

  return {
    completed,
    total,
    value: (completed / total) * 100
  }
}
