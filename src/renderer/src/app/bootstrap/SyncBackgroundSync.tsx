import { useEffect, useRef } from 'react'
import type { SyncPublicState } from '@shared/types/sync'
import { useProxyStore } from '../../store/proxyStore'
import { pushSyncWithActivity } from '../../utils/sync-push'

function SyncBackgroundSync(): null {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stateRef = useRef<SyncPublicState | null>(null)

  useEffect(() => {
    let cancelled = false

    const clearScheduledPush = (): void => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }

    const scheduleNextPush = (state: SyncPublicState): void => {
      clearScheduledPush()

      const { config } = state

      if (config.provider === 'none' || !config.autoSyncEnabled) {
        return
      }

      const intervalMs = config.autoSyncIntervalMinutes * 60 * 1000

      timeoutRef.current = setTimeout(() => {
        void runAutoPush()
      }, intervalMs)
    }

    const refreshState = async (): Promise<SyncPublicState | null> => {
      try {
        const state = await window.api.getSyncConfig()
        stateRef.current = state
        return state
      } catch {
        return null
      }
    }

    const runAutoPush = async (): Promise<void> => {
      if (cancelled) {
        return
      }

      const state = (await refreshState()) ?? stateRef.current

      if (!state || state.config.provider === 'none' || !state.config.autoSyncEnabled) {
        return
      }

      const proxyState = useProxyStore.getState()

      if (proxyState.isCheckingAll || proxyState.checkingIds.size > 0) {
        scheduleNextPush(state)
        return
      }

      await pushSyncWithActivity()
      scheduleNextPush(state)
    }

    const bootstrap = async (): Promise<void> => {
      const state = await refreshState()

      if (cancelled || !state) {
        return
      }

      scheduleNextPush(state)
    }

    void bootstrap()

    const configRefreshTimer = setInterval(() => {
      void (async () => {
        const state = await refreshState()

        if (cancelled || !state) {
          return
        }

        scheduleNextPush(state)
      })()
    }, 30_000)

    return () => {
      cancelled = true
      clearScheduledPush()
      clearInterval(configRefreshTimer)
    }
  }, [])

  return null
}

export default SyncBackgroundSync
