export type ProxyProtocol = 'http' | 'https' | 'socks4' | 'socks5'

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

export const DEFAULT_PORTS: Record<ProxyProtocol, number> = {
  http: 80,
  https: 443,
  socks4: 1080,
  socks5: 1080
}
