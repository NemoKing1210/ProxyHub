import type { ProxyGroup } from '@shared/types/proxy-group'

async function invokeGroups<T>(
  channel: 'groups:get-all' | 'groups:save-all',
  value?: ProxyGroup[]
): Promise<T> {
  if (channel === 'groups:get-all' && typeof window.api.getGroups === 'function') {
    return window.api.getGroups() as Promise<T>
  }

  if (channel === 'groups:save-all' && typeof window.api.saveGroups === 'function') {
    await window.api.saveGroups(value ?? [])
    return undefined as T
  }

  return window.electron.ipcRenderer.invoke(channel, value) as Promise<T>
}

export async function fetchGroups(): Promise<ProxyGroup[]> {
  return invokeGroups<ProxyGroup[]>('groups:get-all')
}

export async function persistGroups(groups: ProxyGroup[]): Promise<void> {
  await invokeGroups<void>('groups:save-all', groups)
}
