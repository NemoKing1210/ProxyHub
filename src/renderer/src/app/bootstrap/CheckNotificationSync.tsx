import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useProxyStore } from '../../store/proxyStore'
import { useSettingsStore } from '../../store/settingsStore'
import {
  buildBatchCheckToast,
  buildSingleCheckToast,
  type BatchCheckResultEntry
} from '../../utils/check-toast'
import { showCheckNotification } from '../../utils/show-check-notification'

interface BatchCheckState {
  alive: number
  dead: number
  suppressNotification: boolean
  results: BatchCheckResultEntry[]
}

function CheckNotificationSync(): null {
  const { t } = useTranslation()
  const isCheckingAll = useProxyStore((state) => state.isCheckingAll)
  const batchRef = useRef<BatchCheckState | null>(null)
  const wasCheckingAllRef = useRef(false)

  useEffect(() => {
    if (isCheckingAll && !wasCheckingAllRef.current) {
      const isAutoChecking = useProxyStore.getState().isAutoChecking
      const autoCheckNotifications = useSettingsStore.getState().settings.autoCheckNotifications

      batchRef.current = {
        alive: 0,
        dead: 0,
        suppressNotification: isAutoChecking && !autoCheckNotifications,
        results: []
      }
    } else if (!isCheckingAll && wasCheckingAllRef.current && batchRef.current) {
      const { alive, dead, suppressNotification, results } = batchRef.current
      const total = alive + dead

      if (total > 0 && !suppressNotification) {
        void showCheckNotification(buildBatchCheckToast(alive, dead, t, results))
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

        const proxy = useProxyStore.getState().proxies.find((item) => item.id === result.id)
        batch.results.push({ result, proxy })
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
