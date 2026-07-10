import { create } from 'zustand'
import type {
  Proxy,
  ProxyCheckProgress,
  ProxyCheckResult,
  ProxyInput
} from '../../../shared/types/proxy'
import type { ProxyCheckOptions } from '../../../shared/types/settings'
import {
  createCheckingConnectivity,
  createPendingDomainChecks,
  finalizeIncompleteProxy,
  resolveProxyStatus,
  resolveProxyStatusFromDomainChecks,
  upsertDomainCheck
} from '../../../shared/utils/proxy-check-results'
import { useSettingsStore } from './settingsStore'

interface ProxyState {
  proxies: Proxy[]
  isLoading: boolean
  isCheckingAll: boolean
  checkingIds: Set<string>
  loadProxies: () => Promise<void>
  addProxy: (input: ProxyInput) => Promise<void>
  updateProxy: (id: string, input: ProxyInput) => Promise<void>
  patchProxy: (
    id: string,
    patch: Partial<
      Pick<Proxy, 'label' | 'icon' | 'color' | 'countryCode' | 'city' | 'anonymityLevel' | 'isFavorite'>
    >
  ) => Promise<void>
  toggleFavorite: (id: string) => Promise<void>
  removeProxy: (id: string) => Promise<void>
  checkProxy: (id: string) => Promise<void>
  checkAll: (proxyIds?: string[]) => Promise<void>
}

function createProxy(input: ProxyInput): Proxy {
  return {
    id: crypto.randomUUID(),
    ...input,
    createdAt: new Date().toISOString(),
    status: 'unknown'
  }
}

function hasConnectionChanges(proxy: Proxy, input: ProxyInput): boolean {
  return (
    proxy.protocol !== input.protocol ||
    proxy.host !== input.host.trim() ||
    proxy.port !== input.port ||
    (proxy.username ?? '') !== (input.username?.trim() ?? '') ||
    (proxy.password ?? '') !== (input.password ?? '')
  )
}

function clearCheckState<T extends Proxy>(proxy: T): T {
  return {
    ...proxy,
    status: 'unknown',
    latencyMs: undefined,
    externalIp: undefined,
    checkTarget: undefined,
    error: undefined,
    errorDetails: undefined,
    domainChecks: undefined,
    connectivity: undefined,
    checkedAt: undefined
  }
}

function applyCheckResult(proxy: Proxy, result: ProxyCheckResult): Proxy {
  return {
    ...proxy,
    status: result.status,
    latencyMs: result.latencyMs,
    externalIp: result.externalIp,
    checkTarget: result.checkTarget,
    error: result.error,
    errorDetails: result.errorDetails,
    domainChecks: result.domainChecks,
    connectivity: result.connectivity,
    checkedAt: result.checkedAt
  }
}

function applyLiveProgress(proxies: Proxy[], progress: ProxyCheckProgress): Proxy[] {
  if (progress.phase === 'init') {
    return proxies.map((proxy) =>
      proxy.id === progress.proxyId
        ? {
            ...proxy,
            status: 'checking',
            domainChecks: progress.domainChecks,
            connectivity: progress.connectivity,
            error: undefined,
            errorDetails: undefined,
            externalIp: undefined,
            checkTarget: undefined
          }
        : proxy
    )
  }

  if (progress.phase === 'proxy-connect') {
    return proxies.map((proxy) =>
      proxy.id === progress.proxyId
        ? {
            ...proxy,
            connectivity: progress.connectivity,
            externalIp: progress.connectivity.externalIp,
            status: resolveProxyStatus(proxy.domainChecks, progress.connectivity)
          }
        : proxy
    )
  }

  if (progress.phase === 'domain') {
    return proxies.map((proxy) => {
      if (proxy.id !== progress.proxyId) {
        return proxy
      }

      const domainChecks = upsertDomainCheck(proxy.domainChecks ?? [], progress.domainCheck)

      return {
        ...proxy,
        domainChecks,
        status: resolveProxyStatusFromDomainChecks(domainChecks)
      }
    })
  }

  return proxies.map((proxy) =>
    proxy.id === progress.result.id ? applyCheckResult(proxy, progress.result) : proxy
  )
}

function isCheckInProgress(state: Pick<ProxyState, 'checkingIds' | 'isCheckingAll'>): boolean {
  return state.isCheckingAll || state.checkingIds.size > 0
}

async function persist(proxies: Proxy[]): Promise<void> {
  await window.api.saveProxies(proxies)
}

function getCheckOptions(): ProxyCheckOptions {
  const { checkDomains, checkTimeoutMs, checkAllConcurrency } =
    useSettingsStore.getState().settings

  return { checkDomains, checkTimeoutMs, checkAllConcurrency }
}

async function checkAllSequential(proxyIds: string[], get: () => ProxyState): Promise<void> {
  for (const id of proxyIds) {
    if (!get().proxies.some((proxy) => proxy.id === id)) continue
    await get().checkProxy(id)
  }
}

async function checkAllParallel(
  proxies: Proxy[],
  checkOptions: ProxyCheckOptions,
  get: () => ProxyState,
  set: (partial: Partial<ProxyState> | ((state: ProxyState) => Partial<ProxyState>)) => void
): Promise<void> {
  const domains = useSettingsStore.getState().settings.checkDomains
  const checkingIds = new Set(proxies.map((proxy) => proxy.id))

  set({
    isCheckingAll: true,
    checkingIds,
    proxies: get().proxies.map((proxy) => beginProxyCheck(proxy, domains))
  })

  const unsubscribe = window.api.onCheckProgress((progress) => {
    set((state) => {
      const updated = applyLiveProgress(state.proxies, progress)

      if (progress.phase === 'complete') {
        void persist(updated)
      }

      return { proxies: updated }
    })
  })

  try {
    await window.api.checkAll(proxies, checkOptions)
  } finally {
    unsubscribe()

    const finalized = get().proxies.map((proxy) =>
      proxy.checkedAt ? proxy : finalizeIncompleteProxy(proxy)
    )

    set({
      isCheckingAll: false,
      checkingIds: new Set(),
      proxies: finalized
    })

    await persist(finalized)
  }
}

function beginProxyCheck(proxy: Proxy, domains: string[]): Proxy {
  return {
    ...proxy,
    status: 'checking',
    error: undefined,
    errorDetails: undefined,
    domainChecks: createPendingDomainChecks(domains),
    connectivity: createCheckingConnectivity(proxy),
    latencyMs: undefined,
    externalIp: undefined,
    checkTarget: undefined,
    checkedAt: undefined
  }
}

function clearCheckingId(checkingIds: Set<string>, id: string): Set<string> {
  const nextCheckingIds = new Set(checkingIds)
  nextCheckingIds.delete(id)
  return nextCheckingIds
}

export const useProxyStore = create<ProxyState>((set, get) => ({
  proxies: [],
  isLoading: true,
  isCheckingAll: false,
  checkingIds: new Set(),

  loadProxies: async () => {
    if (isCheckInProgress(get())) {
      return
    }

    set({ isLoading: true })

    try {
      const proxies = await window.api.getProxies()
      set({ proxies })
    } finally {
      set({ isLoading: false })
    }
  },

  addProxy: async (input) => {
    const proxy = createProxy(input)
    const proxies = [...get().proxies, proxy]

    set({ proxies })
    await persist(proxies)
  },

  updateProxy: async (id, input) => {
    const proxies = get().proxies.map((proxy) => {
      if (proxy.id !== id) {
        return proxy
      }

      const updated: Proxy = {
        ...proxy,
        ...input,
        host: input.host.trim()
      }

      if (!hasConnectionChanges(proxy, input)) {
        return updated
      }

      return clearCheckState(updated)
    })

    set({ proxies })
    await persist(proxies)
  },

  patchProxy: async (id, patch) => {
    const proxies = get().proxies.map((proxy) => (proxy.id === id ? { ...proxy, ...patch } : proxy))

    set({ proxies })
    await persist(proxies)
  },

  toggleFavorite: async (id) => {
    const proxies = get().proxies.map((proxy) =>
      proxy.id === id ? { ...proxy, isFavorite: !proxy.isFavorite } : proxy
    )

    set({ proxies })
    await persist(proxies)
  },

  removeProxy: async (id) => {
    const proxies = get().proxies.filter((proxy) => proxy.id !== id)

    set({ proxies })
    await persist(proxies)
  },

  checkProxy: async (id) => {
    const proxy = get().proxies.find((item) => item.id === id)
    if (!proxy || get().checkingIds.has(id)) return

    const domains = useSettingsStore.getState().settings.checkDomains
    const checkOptions = getCheckOptions()
    const checkingIds = new Set(get().checkingIds)
    checkingIds.add(id)

    set({
      checkingIds,
      proxies: get().proxies.map((item) => (item.id === id ? beginProxyCheck(item, domains) : item))
    })

    const unsubscribe = window.api.onCheckProgress((progress) => {
      if (progress.phase === 'complete') {
        if (progress.result.id !== id) return
      } else if (progress.proxyId !== id) {
        return
      }

      if (progress.phase === 'complete') {
        return
      }

      set({ proxies: applyLiveProgress(get().proxies, progress) })
    })

    try {
      const result = await window.api.checkProxy(proxy, checkOptions)
      const updated = get().proxies.map((item) =>
        item.id === id ? applyCheckResult(item, result) : item
      )

      set({ proxies: updated })
      await persist(updated)
    } catch {
      const updated = get().proxies.map((item) =>
        item.id === id ? finalizeIncompleteProxy(item) : item
      )

      set({ proxies: updated })
      await persist(updated)
    } finally {
      unsubscribe()

      const finalized = get().proxies.map((item) =>
        item.id === id ? finalizeIncompleteProxy(item) : item
      )

      set({
        proxies: finalized,
        checkingIds: clearCheckingId(get().checkingIds, id)
      })
    }
  },

  checkAll: async (proxyIds) => {
    const { proxies } = get()
    const targetIds = proxyIds ?? proxies.map((proxy) => proxy.id)
    const targets = proxies.filter((proxy) => targetIds.includes(proxy.id))

    if (targets.length === 0 || get().isCheckingAll) return

    const { checkAllMode } = useSettingsStore.getState().settings
    const checkOptions = getCheckOptions()
    const ids = targets.map((proxy) => proxy.id)

    if (checkAllMode === 'parallel') {
      await checkAllParallel(targets, checkOptions, get, set)
      return
    }

    set({ isCheckingAll: true })

    try {
      await checkAllSequential(ids, get)
    } finally {
      set({ isCheckingAll: false })
    }
  }
}))
