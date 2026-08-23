import { SYNC_ON_CHANGE_DEBOUNCE_MS } from '@shared/constants/sync'
import type { SyncScope } from '@shared/types/sync'
import { useProxyStore } from '../store/proxyStore'
import { pushSyncWithActivity } from './sync-push'

export type SyncOnChangeCategory = 'settings' | 'proxies'

let suppressUntil = 0
let debounceTimer: ReturnType<typeof setTimeout> | null = null
const pendingChanges = new Set<SyncOnChangeCategory>()
let isPushing = false

export function suppressSyncOnChange(durationMs = SYNC_ON_CHANGE_DEBOUNCE_MS + 1_000): void {
  suppressUntil = Date.now() + durationMs
}

export function isSyncOnChangeSuppressed(): boolean {
  return Date.now() < suppressUntil
}

export function shouldPushForScope(scope: SyncScope, category: SyncOnChangeCategory): boolean {
  if (scope === 'full') {
    return true
  }

  if (scope === 'settings') {
    return category === 'settings'
  }

  return category === 'proxies'
}

function clearScheduledPush(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
}

function schedulePush(): void {
  clearScheduledPush()

  debounceTimer = setTimeout(() => {
    debounceTimer = null
    void runPush()
  }, SYNC_ON_CHANGE_DEBOUNCE_MS)
}

function queueChange(category: SyncOnChangeCategory): void {
  if (isSyncOnChangeSuppressed()) {
    return
  }

  pendingChanges.add(category)
  schedulePush()
}

async function runPush(): Promise<void> {
  if (isPushing) {
    schedulePush()
    return
  }

  const changes = new Set(pendingChanges)
  pendingChanges.clear()

  if (changes.size === 0 || isSyncOnChangeSuppressed()) {
    return
  }

  let syncState

  try {
    syncState = await window.api.getSyncConfig()
  } catch {
    return
  }

  const { config } = syncState

  if (config.provider === 'none' || !config.pushOnChange) {
    return
  }

  const hasRelevantChange = [...changes].some((category) =>
    shouldPushForScope(config.scope, category)
  )

  if (!hasRelevantChange) {
    return
  }

  const proxyState = useProxyStore.getState()

  if (proxyState.isCheckingAll || proxyState.checkingIds.size > 0) {
    for (const category of changes) {
      pendingChanges.add(category)
    }

    schedulePush()
    return
  }

  isPushing = true

  try {
    await pushSyncWithActivity()
  } finally {
    isPushing = false
  }
}

export function notifySyncDataChange(category: SyncOnChangeCategory): void {
  queueChange(category)
}

export function startSyncOnChangeScheduler(): () => void {
  return () => {
    clearScheduledPush()
    pendingChanges.clear()
  }
}
