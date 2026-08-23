import { MAX_LATENCY_FILTER_MAX_MS, MAX_LATENCY_FILTER_MIN_MS } from './proxy-list-view.constants'
import type { ProxyAnonymityLevel, ProxyProtocol } from './proxy'
import { PROXY_PROTOCOLS } from './proxy'

export type ProxyFavoriteFilter = 'all' | 'favorites' | 'nonFavorites'

export type ProxyStatusFilter = 'all' | 'alive' | 'dead'

export type ProxyActivityFilter = 'all' | 'enabled' | 'disabled'

export interface ProxyListFilters {
  searchQuery: string
  countryCode: string
  city: string
  protocol: ProxyProtocol | ''
  anonymityLevel: ProxyAnonymityLevel | ''
  favorite: ProxyFavoriteFilter
  status: ProxyStatusFilter
  activity: ProxyActivityFilter
  maxLatencyMs: number | null
  showEmptyGroups: boolean
}

export const PROXY_SORT_FIELDS = [
  'createdAt',
  'checkedAt',
  'latency',
  'status',
  'country',
  'city',
  'label',
  'protocol',
  'host',
  'port',
  'anonymityLevel'
] as const

export type ProxySortField = (typeof PROXY_SORT_FIELDS)[number]

export type ProxySortDirection = 'asc' | 'desc'

export interface ProxyListViewState {
  filters: ProxyListFilters
  sortField: ProxySortField
  sortDirection: ProxySortDirection
}

export const DEFAULT_PROXY_LIST_FILTERS: ProxyListFilters = {
  searchQuery: '',
  countryCode: '',
  city: '',
  protocol: '',
  anonymityLevel: '',
  favorite: 'all',
  status: 'all',
  activity: 'all',
  maxLatencyMs: null,
  showEmptyGroups: false
}

export const DEFAULT_PROXY_LIST_VIEW: ProxyListViewState = {
  filters: DEFAULT_PROXY_LIST_FILTERS,
  sortField: 'createdAt',
  sortDirection: 'desc'
}

const FAVORITE_FILTERS: ProxyFavoriteFilter[] = ['all', 'favorites', 'nonFavorites']
const STATUS_FILTERS: ProxyStatusFilter[] = ['all', 'alive', 'dead']
const ACTIVITY_FILTERS: ProxyActivityFilter[] = ['all', 'enabled', 'disabled']
const PROTOCOLS: ProxyProtocol[] = PROXY_PROTOCOLS
const ANONYMITY_LEVELS: ProxyAnonymityLevel[] = ['elite', 'anonymous', 'transparent']

function normalizeFavoriteFilter(value: unknown): ProxyFavoriteFilter {
  return FAVORITE_FILTERS.includes(value as ProxyFavoriteFilter)
    ? (value as ProxyFavoriteFilter)
    : 'all'
}

function normalizeStatusFilter(value: unknown): ProxyStatusFilter {
  return STATUS_FILTERS.includes(value as ProxyStatusFilter) ? (value as ProxyStatusFilter) : 'all'
}

function normalizeActivityFilter(value: unknown): ProxyActivityFilter {
  return ACTIVITY_FILTERS.includes(value as ProxyActivityFilter)
    ? (value as ProxyActivityFilter)
    : 'all'
}

function normalizeProtocol(value: unknown): ProxyProtocol | '' {
  return PROTOCOLS.includes(value as ProxyProtocol) ? (value as ProxyProtocol) : ''
}

function normalizeAnonymityLevel(value: unknown): ProxyAnonymityLevel | '' {
  return ANONYMITY_LEVELS.includes(value as ProxyAnonymityLevel)
    ? (value as ProxyAnonymityLevel)
    : ''
}

function normalizeMaxLatencyMs(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const numeric = Number(value)
  if (!Number.isFinite(numeric)) {
    return null
  }

  return Math.min(
    MAX_LATENCY_FILTER_MAX_MS,
    Math.max(MAX_LATENCY_FILTER_MIN_MS, Math.round(numeric))
  )
}

export function normalizeProxyListFilters(
  filters: Partial<ProxyListFilters> | undefined
): ProxyListFilters {
  const merged = { ...DEFAULT_PROXY_LIST_FILTERS, ...(filters ?? {}) }

  return {
    searchQuery: typeof merged.searchQuery === 'string' ? merged.searchQuery : '',
    countryCode: typeof merged.countryCode === 'string' ? merged.countryCode : '',
    city: typeof merged.city === 'string' ? merged.city : '',
    protocol: normalizeProtocol(merged.protocol),
    anonymityLevel: normalizeAnonymityLevel(merged.anonymityLevel),
    favorite: normalizeFavoriteFilter(merged.favorite),
    status: normalizeStatusFilter(merged.status),
    activity: normalizeActivityFilter(merged.activity),
    maxLatencyMs: normalizeMaxLatencyMs(merged.maxLatencyMs),
    showEmptyGroups: merged.showEmptyGroups === true
  }
}

function normalizeSortField(value: unknown): ProxySortField {
  return PROXY_SORT_FIELDS.includes(value as ProxySortField)
    ? (value as ProxySortField)
    : DEFAULT_PROXY_LIST_VIEW.sortField
}

function normalizeSortDirection(value: unknown): ProxySortDirection {
  return value === 'asc' ? 'asc' : 'desc'
}

export function normalizeProxyListView(
  view: Partial<ProxyListViewState> | undefined
): ProxyListViewState {
  const merged = { ...DEFAULT_PROXY_LIST_VIEW, ...(view ?? {}) }

  return {
    filters: normalizeProxyListFilters(merged.filters),
    sortField: normalizeSortField(merged.sortField),
    sortDirection: normalizeSortDirection(merged.sortDirection)
  }
}

export function isProxyListViewEqual(left: ProxyListViewState, right: ProxyListViewState): boolean {
  const normalizedLeft = normalizeProxyListView(left)
  const normalizedRight = normalizeProxyListView(right)

  return JSON.stringify(normalizedLeft) === JSON.stringify(normalizedRight)
}
