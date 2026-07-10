import { useCallback, useState } from 'react'
import {
  DEFAULT_PROXY_LIST_FILTERS,
  isProxyListViewEqual,
  normalizeProxyListView,
  type ProxyListFilters,
  type ProxyListViewState,
  type ProxySortDirection,
  type ProxySortField
} from '../../../shared/types/proxy-list-view'
import { useSettingsStore } from '../store/settingsStore'

interface ProxyListViewActions {
  filters: ProxyListFilters
  sortField: ProxySortField
  sortDirection: ProxySortDirection
  setFilters: (filters: ProxyListFilters) => void
  updateFilters: (patch: Partial<ProxyListFilters>) => void
  setSortField: (sortField: ProxySortField) => void
  setSortDirection: (sortDirection: ProxySortDirection) => void
  resetFilters: () => void
}

export function useProxyListViewState(): ProxyListViewActions {
  const updateSettings = useSettingsStore((state) => state.updateSettings)
  const [viewState, setViewState] = useState<ProxyListViewState>(() =>
    normalizeProxyListView(useSettingsStore.getState().settings.proxyListView)
  )

  const persistViewState = useCallback(
    (updater: (current: ProxyListViewState) => ProxyListViewState) => {
      setViewState((current) => {
        const next = normalizeProxyListView(updater(current))

        if (isProxyListViewEqual(next, current)) {
          return current
        }

        const saved = normalizeProxyListView(useSettingsStore.getState().settings.proxyListView)
        if (!isProxyListViewEqual(next, saved)) {
          void updateSettings({ proxyListView: next })
        }

        return next
      })
    },
    [updateSettings]
  )

  const setFilters = useCallback(
    (filters: ProxyListFilters) => {
      persistViewState((current) => ({ ...current, filters }))
    },
    [persistViewState]
  )

  const updateFilters = useCallback(
    (patch: Partial<ProxyListFilters>) => {
      persistViewState((current) => ({
        ...current,
        filters: { ...current.filters, ...patch }
      }))
    },
    [persistViewState]
  )

  const setSortField = useCallback(
    (sortField: ProxySortField) => {
      persistViewState((current) => ({ ...current, sortField }))
    },
    [persistViewState]
  )

  const setSortDirection = useCallback(
    (sortDirection: ProxySortDirection) => {
      persistViewState((current) => ({ ...current, sortDirection }))
    },
    [persistViewState]
  )

  const resetFilters = useCallback(() => {
    persistViewState((current) => ({ ...current, filters: DEFAULT_PROXY_LIST_FILTERS }))
  }, [persistViewState])

  return {
    filters: viewState.filters,
    sortField: viewState.sortField,
    sortDirection: viewState.sortDirection,
    setFilters,
    updateFilters,
    setSortField,
    setSortDirection,
    resetFilters
  }
}

export { DEFAULT_PROXY_LIST_FILTERS }
