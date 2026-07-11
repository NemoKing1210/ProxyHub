import { create } from 'zustand'
import type { ProxyGroup, ProxyGroupInput } from '../../../shared/types/proxy-group'
import { findDuplicateGroupName } from '../../../shared/utils/proxy-group-identity'
import { fetchGroups, persistGroups } from '../utils/groups-api'
import { notifySyncDataChange } from '../utils/sync-on-change'
import { useProxyStore } from './proxyStore'

interface GroupState {
  groups: ProxyGroup[]
  isLoading: boolean
  loadGroups: () => Promise<void>
  addGroup: (input: ProxyGroupInput) => Promise<ProxyGroup | null>
  updateGroup: (id: string, input: ProxyGroupInput) => Promise<boolean>
  patchGroup: (
    id: string,
    patch: Partial<Pick<ProxyGroup, 'name' | 'icon' | 'color'>>
  ) => Promise<void>
  removeGroup: (id: string) => Promise<void>
}

async function persist(groups: ProxyGroup[]): Promise<void> {
  await persistGroups(groups)
  notifySyncDataChange('proxies')
}

function createGroup(input: ProxyGroupInput): ProxyGroup {
  return {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    icon: input.icon,
    color: input.color,
    createdAt: new Date().toISOString()
  }
}

export const useGroupStore = create<GroupState>((set, get) => ({
  groups: [],
  isLoading: true,

  loadGroups: async () => {
    const shouldShowLoader = get().groups.length === 0
    if (shouldShowLoader) {
      set({ isLoading: true })
    }

    try {
      const groups = await fetchGroups()
      set({ groups })
    } catch (error) {
      console.error('Failed to load proxy groups', error)
      set({ groups: [] })
    } finally {
      if (shouldShowLoader) {
        set({ isLoading: false })
      }
    }
  },

  addGroup: async (input) => {
    if (findDuplicateGroupName(input.name, get().groups)) {
      return null
    }

    const group = createGroup(input)
    const groups = [...get().groups, group]

    set({ groups })
    await persist(groups)
    return group
  },

  updateGroup: async (id, input) => {
    if (findDuplicateGroupName(input.name, get().groups, id)) {
      return false
    }

    const groups = get().groups.map((group) =>
      group.id === id
        ? {
            ...group,
            name: input.name.trim(),
            icon: input.icon,
            color: input.color
          }
        : group
    )

    set({ groups })
    await persist(groups)
    return true
  },

  patchGroup: async (id, patch) => {
    const groups = get().groups.map((group) => (group.id === id ? { ...group, ...patch } : group))

    set({ groups })
    await persist(groups)
  },

  removeGroup: async (id) => {
    const groups = get().groups.filter((group) => group.id !== id)
    const proxies = useProxyStore
      .getState()
      .proxies.map((proxy) => (proxy.groupId === id ? { ...proxy, groupId: undefined } : proxy))

    set({ groups })
    await persist(groups)

    useProxyStore.setState({ proxies })
    await window.api.saveProxies(proxies)
    notifySyncDataChange('proxies')
  }
}))
