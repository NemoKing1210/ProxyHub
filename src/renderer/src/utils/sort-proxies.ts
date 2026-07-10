import { findProxyCountry } from '../../../shared/constants/proxy-countries'
import type { Proxy, ProxyAnonymityLevel, ProxyProtocol, ProxyStatus } from '../../../shared/types/proxy'
import type { ProxySortDirection, ProxySortField } from '../../../shared/types/proxy-list-view'
import { getProxyDisplayName } from '../../../shared/utils/favorite-proxies'
import { getProxyDisplayLatency } from './filter-proxies'

const STATUS_ORDER: Record<ProxyStatus, number> = {
  alive: 0,
  unknown: 1,
  checking: 2,
  dead: 3
}

const ANONYMITY_ORDER: Record<ProxyAnonymityLevel, number> = {
  elite: 0,
  anonymous: 1,
  transparent: 2
}

const PROTOCOL_ORDER: Record<ProxyProtocol, number> = {
  http: 0,
  https: 1,
  socks4: 2,
  socks5: 3,
  mtproto: 4
}

function applyDirection(result: number, direction: ProxySortDirection): number {
  return direction === 'asc' ? result : -result
}

function compareEmptyLast<T>(
  left: T | undefined | null | '',
  right: T | undefined | null | '',
  compare: (leftValue: T, rightValue: T) => number,
  direction: ProxySortDirection
): number {
  const leftEmpty = left === undefined || left === null || left === ''
  const rightEmpty = right === undefined || right === null || right === ''

  if (leftEmpty && rightEmpty) {
    return 0
  }

  if (leftEmpty) {
    return 1
  }

  if (rightEmpty) {
    return -1
  }

  return applyDirection(compare(left as T, right as T), direction)
}

function compareIsoDate(
  left: string | undefined,
  right: string | undefined,
  direction: ProxySortDirection
): number {
  return compareEmptyLast(
    left,
    right,
    (leftValue, rightValue) => Date.parse(leftValue) - Date.parse(rightValue),
    direction
  )
}

function compareNumber(
  left: number | undefined,
  right: number | undefined,
  direction: ProxySortDirection
): number {
  return compareEmptyLast(left, right, (leftValue, rightValue) => leftValue - rightValue, direction)
}

function compareText(
  left: string | undefined,
  right: string | undefined,
  direction: ProxySortDirection
): number {
  return compareEmptyLast(
    left,
    right,
    (leftValue, rightValue) => leftValue.localeCompare(rightValue, undefined, { sensitivity: 'base' }),
    direction
  )
}

function compareProxyField(
  left: Proxy,
  right: Proxy,
  field: ProxySortField,
  direction: ProxySortDirection
): number {
  switch (field) {
    case 'createdAt':
      return compareIsoDate(left.createdAt, right.createdAt, direction)
    case 'checkedAt':
      return compareIsoDate(left.checkedAt, right.checkedAt, direction)
    case 'latency':
      return compareNumber(getProxyDisplayLatency(left), getProxyDisplayLatency(right), direction)
    case 'status':
      return applyDirection(STATUS_ORDER[left.status] - STATUS_ORDER[right.status], direction)
    case 'country': {
      const leftCountry = left.countryCode
        ? (findProxyCountry(left.countryCode)?.name ?? left.countryCode)
        : undefined
      const rightCountry = right.countryCode
        ? (findProxyCountry(right.countryCode)?.name ?? right.countryCode)
        : undefined
      return compareText(leftCountry, rightCountry, direction)
    }
    case 'city':
      return compareText(left.city, right.city, direction)
    case 'label':
      return compareText(getProxyDisplayName(left), getProxyDisplayName(right), direction)
    case 'protocol':
      return applyDirection(PROTOCOL_ORDER[left.protocol] - PROTOCOL_ORDER[right.protocol], direction)
    case 'host':
      return compareText(left.host, right.host, direction)
    case 'port':
      return applyDirection(left.port - right.port, direction)
    case 'anonymityLevel':
      return compareEmptyLast(
        left.anonymityLevel,
        right.anonymityLevel,
        (leftValue, rightValue) => ANONYMITY_ORDER[leftValue] - ANONYMITY_ORDER[rightValue],
        direction
      )
    default:
      return 0
  }
}

export function sortProxies(
  proxies: Proxy[],
  field: ProxySortField,
  direction: ProxySortDirection
): Proxy[] {
  return [...proxies].sort((left, right) => compareProxyField(left, right, field, direction))
}

export function sortProxiesByFavorite(proxies: Proxy[]): Proxy[] {
  return [...proxies].sort((left, right) => Number(Boolean(right.isFavorite)) - Number(Boolean(left.isFavorite)))
}
