import type { TFunction } from 'i18next'
import type { Proxy, ProxyCheckResult } from '../../../shared/types/proxy'
import { formatProxyAddress } from '../../../shared/utils/proxy-format'
import type { ToastSeverity } from '../store/toastStore'

export const CHECK_TOAST_DETAIL_THRESHOLD = 5

export interface BatchCheckResultEntry {
  result: ProxyCheckResult
  proxy?: Proxy
}

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

function buildDetailedBatchMessage(entries: BatchCheckResultEntry[], t: TFunction): string {
  return entries
    .map(({ result, proxy }) => {
      const name = resolveProxyName(proxy, result)
      const isAlive = result.status === 'alive'

      if (isAlive) {
        const details = buildAliveDetails(result, t)
        return details
          ? t('checkToast.detailedAliveLine', { name, details })
          : t('checkToast.detailedAliveLinePlain', { name })
      }

      return t('checkToast.detailedDeadLine', {
        name,
        error: resolveDeadMessage(result, t)
      })
    })
    .join('\n')
}

function resolveBatchSeverity(alive: number, dead: number): ToastSeverity {
  if (dead === 0) {
    return 'success'
  }

  if (alive === 0) {
    return 'error'
  }

  return 'warning'
}

function resolveBatchSummaryMessage(alive: number, dead: number, total: number, t: TFunction): string {
  if (dead === 0) {
    return t('checkToast.batchAllAlive', { total })
  }

  if (alive === 0) {
    return t('checkToast.batchAllDead', { total })
  }

  return t('checkToast.batchPartial', { alive, dead, total })
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
  t: TFunction,
  entries: BatchCheckResultEntry[] = []
): ToastPayload {
  const total = alive + dead

  if (total === 0) {
    return {
      severity: 'warning',
      title: t('checkToast.batchEmptyTitle'),
      duration: 4000
    }
  }

  const severity = resolveBatchSeverity(alive, dead)
  const useDetailedMessage =
    entries.length > 0 && entries.length <= CHECK_TOAST_DETAIL_THRESHOLD

  return {
    severity,
    title: t('checkToast.batchTitle'),
    message: useDetailedMessage
      ? buildDetailedBatchMessage(entries, t)
      : resolveBatchSummaryMessage(alive, dead, total, t),
    duration: useDetailedMessage ? Math.min(12000, 5000 + entries.length * 1200) : 5500
  }
}
