import type { ProxyCheckProgress } from '../types/proxy'

const DEFAULT_THROTTLE_MS = 75

export interface ThrottledProgressEmitter {
  emit: (progress: ProxyCheckProgress) => void
  flush: () => void
}

export function createThrottledProgressEmitter(
  onProgress: (progress: ProxyCheckProgress) => void,
  throttleMs = DEFAULT_THROTTLE_MS
): ThrottledProgressEmitter {
  let timer: ReturnType<typeof setTimeout> | null = null
  const pendingDomainEvents: ProxyCheckProgress[] = []

  const flush = (): void => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }

    if (pendingDomainEvents.length === 0) {
      return
    }

    const events = pendingDomainEvents.splice(0, pendingDomainEvents.length)
    for (const event of events) {
      onProgress(event)
    }
  }

  const scheduleFlush = (): void => {
    if (timer) {
      return
    }

    timer = setTimeout(flush, throttleMs)
  }

  const emit = (progress: ProxyCheckProgress): void => {
    if (progress.phase === 'domain') {
      pendingDomainEvents.push(progress)
      scheduleFlush()
      return
    }

    flush()
    onProgress(progress)
  }

  return { emit, flush }
}
