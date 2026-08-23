import { create } from 'zustand'
import type { Proxy, ProxyCheckProgress, ProxyInput } from '@shared/types/proxy'
import type { ProxyCheckOptions } from '@shared/types/settings'
import { applyCheckResult } from '@shared/utils/proxy-check-apply'
import {
  createCheckingConnectivity,
  createPendingDomainChecks,
  finalizeIncompleteProxy,
  resolveProxyStatus,
  resolveProxyStatusFromDomainChecks,
  upsertDomainCheck
} from '@shared/utils/proxy-check-results'
import { findDuplicateProxy } from '@shared/utils/proxy-identity'
import { skipsDomainChecks } from '@shared/utils/proxy-format'
import { filterEnabledProxies, isProxyEnabled } from '@shared/utils/proxy-enabled'
import { useSettingsStore } from './settingsStore'
import { useAutoCheckStore } from './autoCheckStore'
import { getEnabledCheckDomains } from '@shared/types/settings'
import {
  cancelDebouncedPersist,
  flushDebouncedPersist,
  scheduleDebouncedPersist
} from '../services/debounced-persist'
import { notifySyncDataChange } from '../services/sync-on-change'
import {
  clearProxySearchHaystackCache,
  invalidateProxySearchHaystack,
  pruneProxySearchHaystackCache
} from '../lib/proxy-search-cache'

interface ProxyState {
  proxies: Proxy[]
  proxiesById: Map<string, Proxy>
  isLoading: boolean
  isCheckingAll: boolean
  isAutoChecking: boolean
  checkingIds: Set<string>
  loadProxies: () => Promise<void>
  addProxy: (input: ProxyInput) => Promise<void>
  updateProxy: (id: string, input: ProxyInput) => Promise<void>
  patchProxy: (
    id: string,
    patch: Partial<
      Pick<
        Proxy,
        | 'label'
        | 'icon'
        | 'color'
        | 'countryCode'
        | 'city'
        | 'anonymityLevel'
        | 'isFavorite'
        | 'isEnabled'
        | 'groupId'
      >
    >
  ) => Promise<void>
  toggleFavorite: (id: string) => Promise<void>
  toggleEnabled: (id: string) => Promise<void>
  removeProxy: (id: string) => Promise<void>
  removeProxies: (ids: string[]) => Promise<void>
  checkProxy: (id: string) => Promise<void>
  checkAll: (proxyIds?: string[], options?: { source?: 'manual' | 'auto' }) => Promise<void>
  cancelCheckAll: () => void
  detailsProxyId: string | null
  setDetailsProxyId: (proxyId: string | null) => void
}

function createProxy(input: ProxyInput): Proxy {
  return {
    id: crypto.randomUUID(),
    ...input,
    isEnabled: true,
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
    (proxy.password ?? '') !== (input.password ?? '') ||
    (proxy.secret ?? '') !== (input.secret ?? '')
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

function replaceProxyAt(proxies: Proxy[], index: number, nextProxy: Proxy): Proxy[] {
  if (proxies[index] === nextProxy) {
    return proxies
  }

  const next = proxies.slice()
  next[index] = nextProxy
  return next
}

function applyLiveProgress(proxies: Proxy[], progress: ProxyCheckProgress): Proxy[] {
  const proxyId = progress.phase === 'complete' ? progress.result.id : progress.proxyId
  const index = proxies.findIndex((proxy) => proxy.id === proxyId)

  if (index === -1) {
    return proxies
  }

  const proxy = proxies[index]
  if (!isProxyEnabled(proxy)) {
    return proxies
  }

  if (progress.phase === 'init') {
    return replaceProxyAt(proxies, index, {
      ...proxy,
      status: 'checking',
      domainChecks: progress.domainChecks,
      connectivity: progress.connectivity,
      error: undefined,
      errorDetails: undefined,
      externalIp: undefined,
      checkTarget: undefined
    })
  }

  if (progress.phase === 'proxy-connect') {
    return replaceProxyAt(proxies, index, {
      ...proxy,
      connectivity: progress.connectivity,
      externalIp: progress.connectivity.externalIp,
      status: resolveProxyStatus(proxy.domainChecks, progress.connectivity)
    })
  }

  if (progress.phase === 'domain') {
    const domainChecks = upsertDomainCheck(proxy.domainChecks ?? [], progress.domainCheck)

    return replaceProxyAt(proxies, index, {
      ...proxy,
      domainChecks,
      status: resolveProxyStatusFromDomainChecks(domainChecks)
    })
  }

  return replaceProxyAt(proxies, index, applyCheckResult(proxy, progress.result))
}

function createProxiesById(proxies: Proxy[]): Map<string, Proxy> {
  const map = new Map<string, Proxy>()
  for (const proxy of proxies) {
    map.set(proxy.id, proxy)
  }
  return map
}

// Прогресс-события приходят по IPC пачками; без батчинга каждое событие
// вызывает полный re-render списка. Копим и применяем раз в интервал.
const CHECK_PROGRESS_FLUSH_INTERVAL_MS = 120

function isCheckInProgress(state: Pick<ProxyState, 'checkingIds' | 'isCheckingAll'>): boolean {
  return state.isCheckingAll || state.checkingIds.size > 0
}

async function persist(proxies: Proxy[]): Promise<void> {
  await window.api.saveProxies(proxies)
  notifySyncDataChange('proxies')
}

function getCheckOptions(): ProxyCheckOptions {
  const {
    checkDomains,
    checkTimeoutMs,
    checkAllConcurrency,
    domainCheckConcurrency,
    fetchExternalIp
  } = useSettingsStore.getState().settings

  return {
    checkDomains: getEnabledCheckDomains(checkDomains),
    checkTimeoutMs,
    checkAllConcurrency,
    domainCheckConcurrency,
    fetchExternalIp
  }
}

function getActiveCheckDomains(): string[] {
  return getEnabledCheckDomains(useSettingsStore.getState().settings.checkDomains)
}

function resolveCheckAllConcurrency(): number {
  const { checkAllMode, checkAllConcurrency } = useSettingsStore.getState().settings
  return checkAllMode === 'parallel' ? checkAllConcurrency : 1
}

async function checkAllBatch(
  proxies: Proxy[],
  checkOptions: ProxyCheckOptions,
  get: () => ProxyState,
  set: (partial: Partial<ProxyState> | ((state: ProxyState) => Partial<ProxyState>)) => void
): Promise<void> {
  const domains = getActiveCheckDomains()
  const targetIds = new Set(proxies.map((proxy) => proxy.id))
  const checkingIds = new Set(targetIds)

  set({
    isCheckingAll: true,
    checkingIds,
    proxies: get().proxies.map((proxy) =>
      targetIds.has(proxy.id) ? beginProxyCheck(proxy, domains) : proxy
    )
  })

  const pendingProgress: ProxyCheckProgress[] = []
  let flushTimeout: ReturnType<typeof setTimeout> | null = null

  const flushProgress = (): void => {
    flushTimeout = null
    if (pendingProgress.length === 0) {
      return
    }

    const events = pendingProgress.splice(0, pendingProgress.length)

    set((state) => {
      let proxies = state.proxies
      for (const progress of events) {
        proxies = applyLiveProgress(proxies, progress)
      }

      if (events.some((progress) => progress.phase === 'complete')) {
        scheduleDebouncedPersist(proxies)
      }

      return { proxies }
    })
  }

  const unsubscribe = window.api.onCheckProgress((progress) => {
    pendingProgress.push(progress)
    if (flushTimeout === null) {
      flushTimeout = setTimeout(flushProgress, CHECK_PROGRESS_FLUSH_INTERVAL_MS)
    }
  })

  try {
    await window.api.checkAll(proxies, {
      ...checkOptions,
      checkAllConcurrency: resolveCheckAllConcurrency()
    })
  } finally {
    unsubscribe()
    if (flushTimeout !== null) {
      clearTimeout(flushTimeout)
      flushTimeout = null
    }
    flushProgress()

    const finalized = get().proxies.map((proxy) => {
      if (!targetIds.has(proxy.id)) {
        return proxy
      }

      return proxy.checkedAt ? proxy : finalizeIncompleteProxy(proxy)
    })

    set({
      isCheckingAll: false,
      checkingIds: new Set(),
      proxies: finalized
    })

    await flushDebouncedPersist()
    await persist(finalized)
  }
}

function beginProxyCheck(proxy: Proxy, domains: string[]): Proxy {
  const checkDomains = skipsDomainChecks(proxy.protocol) ? [] : domains

  return {
    ...proxy,
    status: 'checking',
    error: undefined,
    errorDetails: undefined,
    domainChecks: createPendingDomainChecks(checkDomains),
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

export const useProxyStore = create<ProxyState>((rawSet, get) => {
  const set: typeof rawSet = (partial) => {
    rawSet((state) => {
      const next = typeof partial === 'function' ? partial(state) : partial
      if (next.proxies !== undefined && next.proxies !== state.proxies) {
        return { ...next, proxiesById: createProxiesById(next.proxies) }
      }
      return next
    })
  }

  return {
    proxies: [],
    proxiesById: new Map(),
    isLoading: true,
    isCheckingAll: false,
    isAutoChecking: false,
    checkingIds: new Set(),
    detailsProxyId: null,

    setDetailsProxyId: (proxyId) => {
      set({ detailsProxyId: proxyId })
    },

    loadProxies: async () => {
      if (isCheckInProgress(get())) {
        return
      }

      const shouldShowLoader = get().proxies.length === 0
      if (shouldShowLoader) {
        set({ isLoading: true })
      }

      try {
        const proxies = await window.api.getProxies()
        pruneProxySearchHaystackCache(new Set(proxies.map((proxy) => proxy.id)))
        set({ proxies })
      } finally {
        if (shouldShowLoader) {
          set({ isLoading: false })
        }
      }
    },

    addProxy: async (input) => {
      if (findDuplicateProxy(input, get().proxies)) {
        return
      }

      const proxy = createProxy(input)
      const proxies = [...get().proxies, proxy]

      set({ proxies })
      await persist(proxies)
    },

    updateProxy: async (id, input) => {
      if (findDuplicateProxy(input, get().proxies, id)) {
        return
      }

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

      invalidateProxySearchHaystack(id)
      set({ proxies })
      await persist(proxies)
    },

    patchProxy: async (id, patch) => {
      const proxies = get().proxies.map((proxy) =>
        proxy.id === id ? { ...proxy, ...patch } : proxy
      )

      invalidateProxySearchHaystack(id)
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

    toggleEnabled: async (id) => {
      const proxies = get().proxies.map((proxy) =>
        proxy.id === id ? { ...proxy, isEnabled: proxy.isEnabled === false } : proxy
      )

      set({ proxies })
      await persist(proxies)
    },

    removeProxy: async (id) => {
      await get().removeProxies([id])
    },

    removeProxies: async (ids) => {
      if (ids.length === 0) {
        return
      }

      const idSet = new Set(ids)
      const proxies = get().proxies.filter((proxy) => !idSet.has(proxy.id))
      const detailsProxyId = get().detailsProxyId

      for (const id of ids) {
        invalidateProxySearchHaystack(id)
      }

      set({
        proxies,
        detailsProxyId: detailsProxyId && idSet.has(detailsProxyId) ? null : detailsProxyId
      })
      await persist(proxies)
    },

    checkProxy: async (id) => {
      const proxy = get().proxies.find((item) => item.id === id)
      if (!proxy || get().checkingIds.has(id)) return

      const domains = getActiveCheckDomains()
      const checkOptions = getCheckOptions()
      const checkingIds = new Set(get().checkingIds)
      checkingIds.add(id)

      set({
        checkingIds,
        proxies: get().proxies.map((item) =>
          item.id === id ? beginProxyCheck(item, domains) : item
        )
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

        invalidateProxySearchHaystack(id)
        set({ proxies: updated })
        await persist(updated)
      } catch {
        const updated = get().proxies.map((item) =>
          item.id === id ? finalizeIncompleteProxy(item) : item
        )

        invalidateProxySearchHaystack(id)
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

    checkAll: async (proxyIds, options) => {
      const { proxies } = get()
      const targetIds = proxyIds ?? proxies.map((proxy) => proxy.id)
      const targets = filterEnabledProxies(proxies.filter((proxy) => targetIds.includes(proxy.id)))

      if (targets.length === 0 || get().isCheckingAll) return

      const isAutoChecking = options?.source === 'auto'

      if (!isAutoChecking && useSettingsStore.getState().settings.autoCheckEnabled) {
        useAutoCheckStore.getState().bumpSchedule()
      }

      const checkOptions = getCheckOptions()

      set({ isAutoChecking })

      try {
        await checkAllBatch(targets, checkOptions, get, set)
      } finally {
        set({ isAutoChecking: false })
      }
    },

    cancelCheckAll: () => {
      if (!get().isCheckingAll) {
        return
      }

      cancelDebouncedPersist()
      void window.api.cancelCheckAll()
    }
  }
})

export { clearProxySearchHaystackCache }
