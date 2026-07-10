export type ProxyProtocol = 'http' | 'https' | 'socks4' | 'socks5'

export type ProxyAnonymityLevel = 'elite' | 'anonymous' | 'transparent'

export const PROXY_ICON_IDS = [
  'router',
  'dns',
  'cloud',
  'public',
  'shield',
  'vpn',
  'storage',
  'home',
  'work',
  'travel',
  'star',
  'favorite'
] as const

export type ProxyIconId = (typeof PROXY_ICON_IDS)[number]

export const DEFAULT_PROXY_ICON_ID: ProxyIconId = 'router'

export const PROXY_ICON_AUTO_VALUE = 'auto' as const

export const PROXY_ICON_FORM_VALUES = [PROXY_ICON_AUTO_VALUE, ...PROXY_ICON_IDS] as const

export type ProxyIconFormValue = (typeof PROXY_ICON_FORM_VALUES)[number]

export const PROXY_COLOR_IDS = [
  'blue',
  'green',
  'teal',
  'cyan',
  'indigo',
  'purple',
  'pink',
  'red',
  'orange',
  'amber',
  'slate'
] as const

export type ProxyColorId = (typeof PROXY_COLOR_IDS)[number]

export const DEFAULT_PROXY_COLOR_ID: ProxyColorId = 'blue'

export type ProxyStatus = 'unknown' | 'checking' | 'alive' | 'dead'

export interface ProxyCheckErrorDetail {
  domain: string
  url: string
  message: string
  code?: string
}

export interface ProxyDomainCheckResult {
  domain: string
  url: string
  status: 'pending' | 'checking' | 'alive' | 'dead'
  latencyMs?: number
  error?: string
  code?: string
}

export type ProxyConnectivityStatus = 'pending' | 'checking' | 'alive' | 'dead'

export interface ProxyConnectivityResult {
  address: string
  protocol: ProxyProtocol
  proxyUrl: string
  status: ProxyConnectivityStatus
  latencyMs?: number
  error?: string
  code?: string
  externalIp?: string
}

export interface Proxy {
  id: string
  protocol: ProxyProtocol
  host: string
  port: number
  username?: string
  password?: string
  label?: string
  icon?: ProxyIconId
  color?: ProxyColorId
  countryCode?: string
  city?: string
  anonymityLevel?: ProxyAnonymityLevel
  isFavorite?: boolean
  createdAt: string
  status: ProxyStatus
  latencyMs?: number
  externalIp?: string
  checkTarget?: string
  error?: string
  errorDetails?: ProxyCheckErrorDetail[]
  domainChecks?: ProxyDomainCheckResult[]
  connectivity?: ProxyConnectivityResult
  checkedAt?: string
}

export interface ProxyInput {
  protocol: ProxyProtocol
  host: string
  port: number
  username?: string
  password?: string
  label?: string
  icon?: ProxyIconId
  color?: ProxyColorId
  countryCode?: string
  city?: string
  anonymityLevel?: ProxyAnonymityLevel
}

export interface ProxyCheckResult {
  id: string
  status: 'alive' | 'dead'
  latencyMs?: number
  externalIp?: string
  checkTarget?: string
  error?: string
  errorDetails?: ProxyCheckErrorDetail[]
  domainChecks: ProxyDomainCheckResult[]
  connectivity?: ProxyConnectivityResult
  checkedAt: string
}

export type ProxyCheckProgress =
  | {
      phase: 'init'
      proxyId: string
      domainChecks: ProxyDomainCheckResult[]
      connectivity: ProxyConnectivityResult
    }
  | { phase: 'proxy-connect'; proxyId: string; connectivity: ProxyConnectivityResult }
  | { phase: 'domain'; proxyId: string; domainCheck: ProxyDomainCheckResult }
  | { phase: 'complete'; result: ProxyCheckResult }

export const PROXY_PROTOCOLS: ProxyProtocol[] = ['http', 'https', 'socks4', 'socks5']

export const PROXY_ANONYMITY_LEVELS: ProxyAnonymityLevel[] = ['elite', 'anonymous', 'transparent']

export const DEFAULT_PORTS: Record<ProxyProtocol, number> = {
  http: 80,
  https: 443,
  socks4: 1080,
  socks5: 1080
}
