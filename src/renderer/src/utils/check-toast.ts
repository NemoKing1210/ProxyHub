import type { TFunction } from 'i18next'
import type { Proxy, ProxyCheckResult } from '../../../shared/types/proxy'
import { formatProxyAddress } from '../../../shared/utils/proxy-format'
import type { ToastSeverity } from '../store/toastStore'

interface ToastPayload {
  severity: ToastSeverity
  title: string
  message?: string
  duration?: number
}

function resolveProxyName(proxy: Proxy | undefined, result: ProxyCheckResult): string {
  if (proxy?.label?.trim()) {
    return proxy.label.trim()
  }

  if (proxy) {
    return formatProxyAddress(proxy)
  }

  return result.connectivity?.address ?? result.id
}

function resolveDeadMessage(result: ProxyCheckResult, t: TFunction): string {
  if (result.error?.trim()) {
    return result.error.trim()
  }

  if (result.connectivity?.error?.trim()) {
    return result.connectivity.error.trim()
  }

  const failedDomain = result.errorDetails?.[0]
  if (failedDomain?.message?.trim()) {
    return failedDomain.message.trim()
  }

  return t('proxyList.connectivity.failed')
}

function buildAliveDetails(result: ProxyCheckResult, t: TFunction): string | undefined {
  const parts: string[] = []

  if (result.latencyMs !== undefined) {
    parts.push(t('checkToast.latency', { value: result.latencyMs }))
  }

  if (result.externalIp?.trim()) {
    parts.push(t('checkToast.externalIp', { ip: result.externalIp.trim() }))
  }

  if (result.checkTarget?.trim()) {
    parts.push(t('checkToast.checkTarget', { domain: result.checkTarget.trim() }))
  }

  return parts.length > 0 ? parts.join(' · ') : undefined
}

export function buildSingleCheckToast(
  result: ProxyCheckResult,
  proxy: Proxy | undefined,
  t: TFunction
): ToastPayload {
  const name = resolveProxyName(proxy, result)
  const isAlive = result.status === 'alive'

  return {
    severity: isAlive ? 'success' : 'error',
    title: isAlive
      ? t('checkToast.aliveTitle', { name })
      : t('checkToast.deadTitle', { name }),
    message: isAlive ? buildAliveDetails(result, t) : resolveDeadMessage(result, t),
    duration: isAlive ? 4500 : 6000
  }
}

export function buildBatchCheckToast(
  alive: number,
  dead: number,
  t: TFunction
): ToastPayload {
  const total = alive + dead

  if (total === 0) {
    return {
      severity: 'warning',
      title: t('checkToast.batchEmptyTitle'),
      duration: 4000
    }
  }

  let severity: ToastSeverity
  let message: string

  if (dead === 0) {
    severity = 'success'
    message = t('checkToast.batchAllAlive', { total })
  } else if (alive === 0) {
    severity = 'error'
    message = t('checkToast.batchAllDead', { total })
  } else {
    severity = 'warning'
    message = t('checkToast.batchPartial', { alive, dead, total })
  }

  return {
    severity,
    title: t('checkToast.batchTitle'),
    message,
    duration: 5500
  }
}
