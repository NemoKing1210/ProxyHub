import { create } from 'zustand'
import type { ProviderFetchParams, ProviderMeta, ProviderProxy } from '@shared/types/provider'
import type { ProxyCheckProgress } from '@shared/types/proxy'
import type { ProxyInput } from '@shared/types/proxy'
import type { ProxyCheckOptions } from '@shared/types/settings'
import { getEnabledCheckDomains } from '@shared/types/settings'
import { applyCheckResult } from '@shared/utils/proxy-check-apply'
import {
  createCheckingConnectivity,
  createPendingDomainChecks,
  finalizeIncompleteProxy
} from '@shared/utils/proxy-check-results'
import { findDuplicateProxy } from '@shared/utils/proxy-identity'
import { skipsDomainChecks } from '@shared/utils/proxy-format'
import { useSettingsStore } from './settingsStore'
import { useProxyStore } from './proxyStore'

const CHECK_PROGRESS_FLUSH_INTERVAL_MS = 120

interface ProviderState {
  providers: ProviderMeta[]
  isLoadingProviders: boolean
  proxiesByProvider: Record<string, ProviderProxy[]>
  isFetching: Record<string, boolean>
  fetchError: Record<string, string | null>
  checkingIds: Set<string>
  isCheckingAll: boolean
  fetchProviders: () => Promise<void>
  fetchProxies: (providerId: string, params?: ProviderFetchParams) => Promise<void>
  checkProviderProxy: (providerId: string, proxyId: string) => Promise<void>
  checkAllProviderProxies: (providerId: string, proxyIds?: string[]) => Promise<void>
  cancelCheckAll: () => void
  addToMyProxies: (providerId: string, proxyIds: string[]) => Promise<number>
}

function getCheckOptions(): ProxyCheckOptions {
  const settings = useSettingsStore.getState().settings
  return {
    checkDomains: getEnabledCheckDomains(settings.checkDomains),
    checkTimeoutMs: settings.checkTimeoutMs,
    domainCheckConcurrency: settings.domainCheckConcurrency,
    checkAllConcurrency: settings.checkAllConcurrency,
    fetchExternalIp: settings.fetchExternalIp
  }
}

function getActiveCheckDomains(): string[] {
  return getEnabledCheckDomains(useSettingsStore.getState().settings.checkDomains)
}

function resolveCheckAllConcurrency(): number {
  return useSettingsStore.getState().settings.checkAllConcurrency
}

function beginProviderCheck(proxy: ProviderProxy, domains: string[]): ProviderProxy {
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

function applyLiveProgressToList(
  proxies: ProviderProxy[],
  progress: ProxyCheckProgress
): ProviderProxy[] {
  const proxyId = progress.phase === 'complete' ? progress.result.id : progress.proxyId
  const index = proxies.findIndex((p) => p.id === proxyId)
  if (index === -1) return proxies

  const proxy = proxies[index]
  let next: ProviderProxy

  if (progress.phase === 'init') {
    next = {
      ...proxy,
      status: 'checking',
      domainChecks: progress.domainChecks,
      connectivity: progress.connectivity,
      error: undefined,
      errorDetails: undefined,
      externalIp: undefined,
      checkTarget: undefined
    }
  } else if (progress.phase === 'proxy-connect') {
    next = {
      ...proxy,
      connectivity: progress.connectivity,
      externalIp: progress.connectivity.externalIp
    }
  } else if (progress.phase === 'domain') {
    const existing = proxy.domainChecks ?? []
    const idx = existing.findIndex((d) => d.domain === progress.domainCheck.domain)
    let domainChecks: ProviderProxy['domainChecks']
    if (idx === -1) {
      domainChecks = [...existing, progress.domainCheck]
    } else {
      domainChecks = existing.slice()
      domainChecks[idx] = progress.domainCheck
    }
    next = { ...proxy, domainChecks }
  } else if (progress.phase === 'complete') {
    const base = applyCheckResult(proxy, progress.result)
    next = { ...base, providerId: proxy.providerId, providerMeta: proxy.providerMeta }
  } else {
    return proxies
  }

  const nextList = proxies.slice()
  nextList[index] = next
  return nextList
}

function clearCheckingId(checkingIds: Set<string>, id: string): Set<string> {
  const next = new Set(checkingIds)
  next.delete(id)
  return next
}

export const useProviderStore = create<ProviderState>((set, get) => ({
  providers: [],
  isLoadingProviders: false,
  proxiesByProvider: {},
  isFetching: {},
  fetchError: {},
  checkingIds: new Set<string>(),
  isCheckingAll: false,

  fetchProviders: async () => {
    set({ isLoadingProviders: true })
    try {
      const providers = await window.api.listProviders()
      set({ providers })
    } finally {
      set({ isLoadingProviders: false })
    }
  },

  fetchProxies: async (providerId, params) => {
    set((s) => ({
      isFetching: { ...s.isFetching, [providerId]: true },
      fetchError: { ...s.fetchError, [providerId]: null }
    }))
    try {
      const result = await window.api.fetchProviderProxies(providerId, params)
      set((s) => ({
        proxiesByProvider: { ...s.proxiesByProvider, [providerId]: result.proxies }
      }))
    } catch (error) {
      let message: string
      if (error instanceof Error) message = error.message
      else if (
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof error.message === 'string'
      )
        message = error.message
      else message = String(error)
      set((s) => ({
        fetchError: { ...s.fetchError, [providerId]: message }
      }))
      throw error
    } finally {
      set((s) => ({
        isFetching: { ...s.isFetching, [providerId]: false }
      }))
    }
  },

  checkProviderProxy: async (providerId, proxyId) => {
    const list = get().proxiesByProvider[providerId]
    if (!list) return
    const proxy = list.find((p) => p.id === proxyId)
    if (!proxy || get().checkingIds.has(proxyId)) return

    const domains = getActiveCheckDomains()
    const checkOptions = getCheckOptions()

    set((s) => {
      const next = new Set(s.checkingIds)
      next.add(proxyId)
      const current = s.proxiesByProvider[providerId] ?? []
      const updated = current.map((p) => (p.id === proxyId ? beginProviderCheck(p, domains) : p))
      return {
        checkingIds: next,
        proxiesByProvider: { ...s.proxiesByProvider, [providerId]: updated }
      }
    })

    const unsubscribe = window.api.onCheckProgress((progress) => {
      const pid = progress.phase === 'complete' ? progress.result.id : progress.proxyId
      if (pid !== proxyId) return
      if (progress.phase === 'complete') return
      set((s) => {
        const current = s.proxiesByProvider[providerId] ?? []
        return {
          proxiesByProvider: {
            ...s.proxiesByProvider,
            [providerId]: applyLiveProgressToList(current, progress)
          }
        }
      })
    })

    try {
      const result = await window.api.checkProxy(proxy, checkOptions)
      set((s) => {
        const current = s.proxiesByProvider[providerId] ?? []
        const updated: ProviderProxy[] = current.map((p) =>
          p.id === proxyId
            ? {
                ...applyCheckResult(p, result),
                providerId: p.providerId,
                providerMeta: p.providerMeta
              }
            : p
        )
        return { proxiesByProvider: { ...s.proxiesByProvider, [providerId]: updated } }
      })
    } catch {
      set((s) => {
        const current = s.proxiesByProvider[providerId] ?? []
        const updated: ProviderProxy[] = current.map((p) => {
          if (p.id !== proxyId) return p
          const f = finalizeIncompleteProxy(p)
          return { ...f, providerId: p.providerId, providerMeta: p.providerMeta }
        })
        // restore provider fields after finalize
        const restored: ProviderProxy[] = updated.map((p) => {
          const orig = list.find((o) => o.id === p.id)
          if (orig) {
            return { ...p, providerId: orig.providerId, providerMeta: orig.providerMeta }
          }
          return p
        })
        return { proxiesByProvider: { ...s.proxiesByProvider, [providerId]: restored } }
      })
    } finally {
      unsubscribe()
      set((s) => {
        const current = s.proxiesByProvider[providerId] ?? []
        // ensure finalize if still checking without checkedAt
        const finalized: ProviderProxy[] = current.map((p) => {
          if (p.id !== proxyId) return p
          if (p.checkedAt) return p
          const f = finalizeIncompleteProxy(p)
          return { ...f, providerId: p.providerId, providerMeta: p.providerMeta }
        })
        return {
          checkingIds: clearCheckingId(s.checkingIds, proxyId),
          proxiesByProvider: { ...s.proxiesByProvider, [providerId]: finalized }
        }
      })
    }
  },

  checkAllProviderProxies: async (providerId, proxyIds) => {
    const all = get().proxiesByProvider[providerId] ?? []
    const targets = proxyIds ? all.filter((p) => proxyIds.includes(p.id)) : all
    if (targets.length === 0 || get().isCheckingAll) return

    const domains = getActiveCheckDomains()
    const checkOptions = getCheckOptions()
    const targetIds = new Set(targets.map((p) => p.id))
    const checkingIds = new Set(targetIds)

    set((s) => {
      const current = s.proxiesByProvider[providerId] ?? []
      const updated = current.map((p) => (targetIds.has(p.id) ? beginProviderCheck(p, domains) : p))
      return {
        isCheckingAll: true,
        checkingIds,
        proxiesByProvider: { ...s.proxiesByProvider, [providerId]: updated }
      }
    })

    const pendingProgress: ProxyCheckProgress[] = []
    let flushTimeout: ReturnType<typeof setTimeout> | null = null

    const flushProgress = (): void => {
      flushTimeout = null
      if (pendingProgress.length === 0) return
      const events = pendingProgress.splice(0, pendingProgress.length)
      set((s) => {
        let list = s.proxiesByProvider[providerId] ?? []
        for (const progress of events) {
          list = applyLiveProgressToList(list, progress)
        }
        return { proxiesByProvider: { ...s.proxiesByProvider, [providerId]: list } }
      })
    }

    const unsubscribe = window.api.onCheckProgress((progress) => {
      const pid = progress.phase === 'complete' ? progress.result.id : progress.proxyId
      if (!targetIds.has(pid)) return
      pendingProgress.push(progress)
      if (flushTimeout === null) {
        flushTimeout = setTimeout(flushProgress, CHECK_PROGRESS_FLUSH_INTERVAL_MS)
      }
    })

    try {
      await window.api.checkAll(targets, {
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

      set((s) => {
        const current = s.proxiesByProvider[providerId] ?? []
        const finalized: ProviderProxy[] = current.map((p) => {
          if (!targetIds.has(p.id)) return p
          if (p.checkedAt) return p
          const f = finalizeIncompleteProxy(p)
          return { ...f, providerId: p.providerId, providerMeta: p.providerMeta }
        })
        return {
          isCheckingAll: false,
          checkingIds: new Set<string>(),
          proxiesByProvider: { ...s.proxiesByProvider, [providerId]: finalized }
        }
      })
    }
  },

  cancelCheckAll: () => {
    if (!get().isCheckingAll && get().checkingIds.size === 0) return
    void window.api.cancelCheckAll()
  },

  addToMyProxies: async (providerId, proxyIds) => {
    const list = get().proxiesByProvider[providerId] ?? []
    const selected = list.filter((p) => proxyIds.includes(p.id))
    if (selected.length === 0) return 0

    const existing = useProxyStore.getState().proxies
    let added = 0

    for (const pp of selected) {
      const input: ProxyInput = {
        protocol: pp.protocol,
        host: pp.host,
        port: pp.port,
        username: pp.username,
        password: pp.password,
        secret: pp.secret,
        countryCode: pp.countryCode,
        city: pp.city,
        anonymityLevel: pp.anonymityLevel
      }

      if (
        findDuplicateProxy(input, existing) ||
        findDuplicateProxy(input, useProxyStore.getState().proxies)
      ) {
        continue
      }

      // useProxyStore addProxy dedupes internally but we need to await sequentially to keep existing check
      await useProxyStore.getState().addProxy(input)
      added += 1
    }

    return added
  }
}))
