import { findProxyCountry } from '../constants/proxy-countries'
import type { Proxy } from '../types/proxy'
import type { TrayMenuStrings } from '../i18n/tray-menu'
import { getProxyDisplayName } from './favorite-proxies'
import { formatProxyAddress } from './proxy-format'

const STATUS_SYMBOL: Record<Proxy['status'], string> = {
  alive: '✓',
  dead: '✗',
  checking: '…',
  unknown: '○'
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value
  }

  return `${value.slice(0, maxLength - 1)}…`
}

export function getProxyServerLatencyMs(proxy: Proxy): number | undefined {
  return proxy.connectivity?.latencyMs
}

export function getProxyExternalIp(proxy: Proxy): string | undefined {
  return proxy.connectivity?.externalIp ?? proxy.externalIp
}

function getStatusText(proxy: Proxy, strings: TrayMenuStrings): string {
  if (proxy.connectivity?.status === 'alive' && proxy.status !== 'dead') {
    return strings.statusAlive
  }

  if (proxy.connectivity?.status === 'dead') {
    return strings.statusDead
  }

  return {
    alive: strings.statusAlive,
    dead: strings.statusDead,
    checking: strings.statusChecking,
    unknown: strings.statusUnknown
  }[proxy.status]
}

function formatLocation(proxy: Proxy): string | undefined {
  const country = proxy.countryCode ? findProxyCountry(proxy.countryCode) : undefined
  const countryLabel = country?.name ?? proxy.countryCode

  if (proxy.city && countryLabel) {
    return `${proxy.city}, ${countryLabel}`
  }

  return proxy.city ?? countryLabel
}

export function formatTrayProxyMenuPrimary(proxy: Proxy, strings: TrayMenuStrings): string {
  const symbol = STATUS_SYMBOL[proxy.status]
  const name = truncate(getProxyDisplayName(proxy), 24)
  const protocol = proxy.protocol.toUpperCase()
  const status = getStatusText(proxy, strings)
  const disabledSuffix = proxy.isEnabled === false ? ` · ${strings.disabled}` : ''

  return truncate(`${symbol} ${name} · ${protocol} · ${status}${disabledSuffix}`, 72)
}

export function formatTrayProxyMenuSecondary(proxy: Proxy, strings: TrayMenuStrings): string {
  const parts: string[] = [formatProxyAddress(proxy)]

  const serverLatency = getProxyServerLatencyMs(proxy)
  if (serverLatency !== undefined) {
    parts.push(strings.serverLatency.replace('{{value}}', String(serverLatency)))
  }

  const externalIp = getProxyExternalIp(proxy)
  if (externalIp) {
    parts.push(`${strings.externalIp} ${externalIp}`)
  }

  const location = formatLocation(proxy)
  if (location) {
    parts.push(location)
  }

  if (proxy.anonymityLevel) {
    parts.push(strings.anonymity[proxy.anonymityLevel])
  }

  if (proxy.connectivity?.status === 'dead' && proxy.connectivity.error) {
    parts.push(truncate(proxy.connectivity.error, 28))
  }

  return truncate(parts.join(' · '), 88)
}
