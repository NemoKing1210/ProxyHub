import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createThrottledProgressEmitter } from '@shared/utils/proxy-progress-throttle'
import type { ProxyCheckProgress } from '@shared/types/proxy'

function domainEvent(proxyId: string): ProxyCheckProgress {
  return {
    phase: 'domain',
    proxyId,
    domainCheck: {
      domain: 'example.com',
      url: 'https://example.com',
      status: 'alive'
    }
  }
}

describe('createThrottledProgressEmitter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('batches domain events within the throttle window', () => {
    const onProgress = vi.fn()
    const emitter = createThrottledProgressEmitter(onProgress, 75)

    emitter.emit(domainEvent('a'))
    emitter.emit(domainEvent('b'))
    emitter.emit(domainEvent('c'))

    expect(onProgress).not.toHaveBeenCalled()

    vi.advanceTimersByTime(75)

    expect(onProgress).toHaveBeenCalledTimes(3)
  })

  it('passes non-domain events through immediately and flushes pending domain events first', () => {
    const onProgress = vi.fn()
    const emitter = createThrottledProgressEmitter(onProgress, 75)
    const complete: ProxyCheckProgress = {
      phase: 'complete',
      result: { id: 'a', status: 'alive', domainChecks: [], checkedAt: '' }
    }

    emitter.emit(domainEvent('a'))
    emitter.emit(complete)

    expect(onProgress).toHaveBeenCalledTimes(2)
    expect(onProgress).toHaveBeenNthCalledWith(1, domainEvent('a'))
    expect(onProgress).toHaveBeenNthCalledWith(2, complete)

    // The pending timer must not re-deliver the already flushed event.
    vi.advanceTimersByTime(200)
    expect(onProgress).toHaveBeenCalledTimes(2)
  })

  it('flush delivers queued events synchronously', () => {
    const onProgress = vi.fn()
    const emitter = createThrottledProgressEmitter(onProgress, 75)

    emitter.emit(domainEvent('a'))
    emitter.flush()

    expect(onProgress).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(200)
    expect(onProgress).toHaveBeenCalledTimes(1)
  })

  it('flush without pending events is a no-op', () => {
    const onProgress = vi.fn()
    const emitter = createThrottledProgressEmitter(onProgress, 75)

    emitter.flush()

    expect(onProgress).not.toHaveBeenCalled()
  })
})
