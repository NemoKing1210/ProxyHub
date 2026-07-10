import { create } from 'zustand'
import type { Proxy, ProxyCheckResult, ProxyInput } from '../../../shared/types/proxy'

interface ProxyState {
  proxies: Proxy[]
  isLoading: boolean
  isCheckingAll: boolean
  checkingIds: Set<string>
  loadProxies: () => Promise<void>
  addProxy: (input: ProxyInput) => Promise<void>
  updateProxy: (id: string, input: ProxyInput) => Promise<void>
  removeProxy: (id: string) => Promise<void>
  checkProxy: (id: string) => Promise<void>
  checkAll: () => Promise<void>
}

function createProxy(input: ProxyInput): Proxy {
  return {
    id: crypto.randomUUID(),
    ...input,
    createdAt: new Date().toISOString(),
    status: 'unknown'
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
    checkedAt: result.checkedAt
  }
}

async function persist(proxies: Proxy[]): Promise<void> {
  await window.api.saveProxies(proxies)
}

export const useProxyStore = create<ProxyState>((set, get) => ({
  proxies: [],
  isLoading: true,
  isCheckingAll: false,
  checkingIds: new Set(),

  loadProxies: async () => {
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
    const proxies = get().proxies.map((proxy) =>
      proxy.id === id
        ? {
            ...proxy,
            ...input,
            status: 'unknown' as const,
            latencyMs: undefined,
            externalIp: undefined,
            checkTarget: undefined,
            error: undefined,
            errorDetails: undefined,
            domainChecks: undefined,
            checkedAt: undefined
          }
        : proxy
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
    if (!proxy) return

    const checkingIds = new Set(get().checkingIds)
    checkingIds.add(id)

    const proxies = get().proxies.map((item) =>
      item.id === id ? { ...item, status: 'checking' as const, error: undefined, errorDetails: undefined, domainChecks: undefined } : item
    )

    set({ proxies, checkingIds })

    try {
      const result = await window.api.checkProxy(proxy)
      const updated = get().proxies.map((item) =>
        item.id === id ? applyCheckResult(item, result) : item
      )

      set({ proxies: updated })
      await persist(updated)
    } finally {
      const nextCheckingIds = new Set(get().checkingIds)
      nextCheckingIds.delete(id)
      set({ checkingIds: nextCheckingIds })
    }
  },

  checkAll: async () => {
    const { proxies } = get()
    if (proxies.length === 0) return

    set({
      isCheckingAll: true,
      checkingIds: new Set(proxies.map((proxy) => proxy.id)),
      proxies: proxies.map((proxy) => ({
        ...proxy,
        status: 'checking',
        error: undefined,
        errorDetails: undefined,
        domainChecks: undefined
      }))
    })

    const unsubscribe = window.api.onCheckProgress((result) => {
      const updated = get().proxies.map((proxy) =>
        proxy.id === result.id ? applyCheckResult(proxy, result) : proxy
      )

      set({ proxies: updated })
      void persist(updated)
    })

    try {
      await window.api.checkAll(proxies)
      await persist(get().proxies)
    } finally {
      unsubscribe()
      set({ isCheckingAll: false, checkingIds: new Set() })
    }
  }
}))
