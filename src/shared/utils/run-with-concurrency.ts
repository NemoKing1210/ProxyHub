export async function runWithConcurrency<T>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>,
  shouldStop?: () => boolean
): Promise<void> {
  if (items.length === 0) {
    return
  }

  let index = 0
  const limit = Math.max(1, Math.min(Math.round(concurrency), items.length))

  async function runWorker(): Promise<void> {
    while (index < items.length) {
      if (shouldStop?.()) {
        return
      }

      const currentIndex = index
      index += 1
      await worker(items[currentIndex], currentIndex)
    }
  }

  await Promise.all(Array.from({ length: limit }, () => runWorker()))
}
