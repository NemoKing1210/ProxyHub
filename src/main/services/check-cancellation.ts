export class CheckCancelledError extends Error {
  static readonly message = 'Check cancelled'

  constructor() {
    super(CheckCancelledError.message)
    this.name = 'CheckCancelledError'
  }
}

let activeAbortController: AbortController | null = null

export function isCheckCancelledError(error: unknown): boolean {
  return error instanceof CheckCancelledError
}

export function throwIfCancelled(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new CheckCancelledError()
  }
}

export function beginCancellableCheck(): AbortSignal {
  activeAbortController?.abort()
  activeAbortController = new AbortController()
  return activeAbortController.signal
}

export function cancelActiveCheck(): void {
  activeAbortController?.abort()
  activeAbortController = null
}

export function clearCancellableCheck(signal: AbortSignal): void {
  if (activeAbortController?.signal === signal) {
    activeAbortController = null
  }
}
