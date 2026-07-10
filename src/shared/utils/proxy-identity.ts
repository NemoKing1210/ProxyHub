import type { Proxy, ProxyInput } from '../types/proxy'

export type ProxyConnectionIdentity = Pick<
  ProxyInput,
  'protocol' | 'host' | 'port' | 'username' | 'password' | 'secret'
>

export function normalizeProxyConnection(input: ProxyConnectionIdentity): {
  protocol: ProxyInput['protocol']
  host: string
  port: number
  username: string
  password: string
  secret: string
} {
  return {
    protocol: input.protocol,
    host: input.host.trim().toLowerCase(),
    port: input.port,
    username: (input.username ?? '').trim(),
    password: input.password ?? '',
    secret: (input.secret ?? '').trim().toLowerCase()
  }
}

export function isSameProxyConnection(
  left: ProxyConnectionIdentity,
  right: ProxyConnectionIdentity
): boolean {
  const normalizedLeft = normalizeProxyConnection(left)
  const normalizedRight = normalizeProxyConnection(right)

  return (
    normalizedLeft.protocol === normalizedRight.protocol &&
    normalizedLeft.host === normalizedRight.host &&
    normalizedLeft.port === normalizedRight.port &&
    normalizedLeft.username === normalizedRight.username &&
    normalizedLeft.password === normalizedRight.password &&
    normalizedLeft.secret === normalizedRight.secret
  )
}

export function findDuplicateProxy<T extends ProxyConnectionIdentity & Pick<Proxy, 'id'>>(
  input: ProxyConnectionIdentity,
  existing: T[],
  excludeId?: string
): T | undefined {
  return existing.find((proxy) => {
    if (excludeId && proxy.id === excludeId) {
      return false
    }

    return isSameProxyConnection(input, proxy)
  })
}
