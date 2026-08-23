import { describe, expect, it, vi } from 'vitest'
import { runWithConcurrency } from '@shared/utils/run-with-concurrency'

function createDeferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

describe('runWithConcurrency', () => {
  it('processes empty list', async () => {
    const processed: number[] = []
    await runWithConcurrency([], 4, async (item) => {
      processed.push(item)
    })
    expect(processed).toEqual([])
  })

  it('processes all items exactly once', async () => {
    const items = Array.from({ length: 50 }, (_, i) => i)
    const processed: number[] = []

    await runWithConcurrency(items, 5, async (item) => {
      processed.push(item)
    })

    expect([...processed].sort((a, b) => a - b)).toEqual(items)
  })

  it('never exceeds the concurrency limit', async () => {
    const items = Array.from({ length: 20 }, (_, i) => i)
    let inFlight = 0
    let peak = 0
    const gates = items.map(() => createDeferred<void>())

    const run = runWithConcurrency(items, 3, async (_item, index) => {
      inFlight += 1
      peak = Math.max(peak, inFlight)
      await gates[index].promise
      inFlight -= 1
    })

    for (const gate of gates) gate.resolve()
    await run

    expect(peak).toBe(3)
  })

  it('caps concurrency to item count', async () => {
    const items = [1, 2]
    let inFlight = 0
    let peak = 0
    const gates = items.map(() => createDeferred<void>())

    const run = runWithConcurrency(items, 10, async (_item, index) => {
      inFlight += 1
      peak = Math.max(peak, inFlight)
      await gates[index].promise
      inFlight -= 1
    })

    for (const gate of gates) gate.resolve()
    await run

    expect(peak).toBe(2)
  })

  it('stops scheduling new work when shouldStop returns true', async () => {
    const processed: number[] = []
    let stopped = false
    const items = Array.from({ length: 10 }, (_, i) => i)

    await runWithConcurrency(
      items,
      2,
      async (item) => {
        processed.push(item)
        stopped = true
      },
      () => stopped
    )

    // With concurrency 2 both workers stop after their first item at most.
    expect(processed.length).toBeLessThanOrEqual(2)
  })

  it('rejects when a worker throws', async () => {
    const error = new Error('boom')
    await expect(
      runWithConcurrency([1], 1, async () => {
        throw error
      })
    ).rejects.toThrow(error)
  })

  it('rounds fractional concurrency', async () => {
    const spy = vi.fn()
    await runWithConcurrency([1, 2, 3], 2.7, async (item) => {
      spy(item)
    })
    expect(spy).toHaveBeenCalledTimes(3)
  })
})
