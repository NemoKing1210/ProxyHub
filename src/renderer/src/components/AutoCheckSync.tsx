import { useEffect, useRef } from 'react'
import { resolveAutoCheckProxyIds } from '../../../shared/utils/auto-check-scope'
import { useGroupStore } from '../store/groupStore'
import { useProxyStore } from '../store/proxyStore'
import { useSettingsStore } from '../store/settingsStore'

function AutoCheckSync(): null {
  const autoCheckEnabled = useSettingsStore((state) => state.settings.autoCheckEnabled)
  const autoCheckIntervalMinutes = useSettingsStore(
    (state) => state.settings.autoCheckIntervalMinutes
  )
  const autoCheckScope = useSettingsStore((state) => state.settings.autoCheckScope)
  const autoCheckGroupIds = useSettingsStore((state) => state.settings.autoCheckGroupIds)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    void useGroupStore.getState().loadGroups()
  }, [])

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (!autoCheckEnabled) {
      return
    }

    const intervalMs = autoCheckIntervalMinutes * 60 * 1000

    const runAutoCheck = (): void => {
      const settings = useSettingsStore.getState().settings
      if (!settings.autoCheckEnabled) {
        return
      }

      const proxyState = useProxyStore.getState()
      if (proxyState.isCheckingAll || proxyState.checkingIds.size > 0) {
        return
      }

      const proxyIds = resolveAutoCheckProxyIds(
        proxyState.proxies,
        settings.autoCheckScope,
        settings.autoCheckGroupIds
      )

      if (proxyIds.length === 0) {
        return
      }

      void proxyState.checkAll(proxyIds, { source: 'auto' })
    }

    timerRef.current = setInterval(runAutoCheck, intervalMs)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [autoCheckEnabled, autoCheckIntervalMinutes, autoCheckScope, autoCheckGroupIds])

  return null
}

export default AutoCheckSync
