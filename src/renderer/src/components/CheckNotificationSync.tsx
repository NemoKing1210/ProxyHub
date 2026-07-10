import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useProxyStore } from '../store/proxyStore'
import { useSettingsStore } from '../store/settingsStore'
import { buildBatchCheckToast, buildSingleCheckToast } from '../utils/check-toast'
import { showCheckNotification } from '../utils/show-check-notification'

function CheckNotificationSync(): null {
  const { t } = useTranslation()
  const isCheckingAll = useProxyStore((state) => state.isCheckingAll)
  const batchRef = useRef<{ alive: number; dead: number; suppressNotification: boolean } | null>(
    null
  )
  const wasCheckingAllRef = useRef(false)

  useEffect(() => {
    if (isCheckingAll && !wasCheckingAllRef.current) {
      const isAutoChecking = useProxyStore.getState().isAutoChecking
      const autoCheckNotifications = useSettingsStore.getState().settings.autoCheckNotifications

      batchRef.current = {
        alive: 0,
        dead: 0,
        suppressNotification: isAutoChecking && !autoCheckNotifications
      }
    } else if (!isCheckingAll && wasCheckingAllRef.current && batchRef.current) {
      const { alive, dead, suppressNotification } = batchRef.current
      const total = alive + dead

      if (total > 0 && !suppressNotification) {
        void showCheckNotification(buildBatchCheckToast(alive, dead, t))
      }

      batchRef.current = null
    }

    wasCheckingAllRef.current = isCheckingAll
  }, [isCheckingAll, t])

  useEffect(() => {
    const unsubscribe = window.api.onCheckProgress((progress) => {
      if (progress.phase !== 'complete') {
        return
      }

      const { result } = progress
      const batch = batchRef.current

      if (batch) {
        if (result.status === 'alive') {
          batch.alive += 1
        } else {
          batch.dead += 1
        }
        return
      }

      const proxy = useProxyStore.getState().proxies.find((item) => item.id === result.id)
      void showCheckNotification(buildSingleCheckToast(result, proxy, t))
    })

    return unsubscribe
  }, [t])

  return null
}

export default CheckNotificationSync
