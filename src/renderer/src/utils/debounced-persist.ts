import type { Proxy } from '../../../shared/types/proxy'
import { notifySyncDataChange } from './sync-on-change'

const DEFAULT_DELAY_MS = 500

let timer: ReturnType<typeof setTimeout> | null = null
let latestProxies: Proxy[] | null = null
let inFlight: Promise<void> | null = null

export function scheduleDebouncedPersist(proxies: Proxy[], delayMs = DEFAULT_DELAY_MS): void {
  latestProxies = proxies

  if (timer) {
    clearTimeout(timer)
  }

  timer = setTimeout(() => {
    timer = null
    void flushDebouncedPersist()
  }, delayMs)
}

export async function flushDebouncedPersist(): Promise<void> {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }

  if (!latestProxies) {
    if (inFlight) {
      await inFlight
    }
    return
  }

  const toSave = latestProxies
  latestProxies = null

  inFlight = window.api.saveProxies(toSave).finally(() => {
    notifySyncDataChange('proxies')
    inFlight = null
  })

  await inFlight
}

export function cancelDebouncedPersist(): void {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }

  latestProxies = null
}
