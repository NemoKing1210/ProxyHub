import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAutoCheckStore } from '../store/autoCheckStore'
import { useProxyStore } from '../store/proxyStore'
import { formatCountdown } from '../lib/format-countdown'

export function useAutoCheckCountdown(enabled: boolean): string | null {
  const { t } = useTranslation()
  const nextCheckAt = useAutoCheckStore((state) => state.nextCheckAt)
  const isAutoChecking = useProxyStore((state) => state.isAutoChecking)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!enabled || nextCheckAt === null) {
      return
    }

    const tick = (): void => setNow(Date.now())
    const timer = window.setInterval(tick, 1000)
    tick()

    return () => window.clearInterval(timer)
  }, [enabled, nextCheckAt])

  if (!enabled) {
    return null
  }

  if (isAutoChecking) {
    return t('settings.autoCheckRunning')
  }

  if (nextCheckAt === null) {
    return null
  }

  return formatCountdown(nextCheckAt - now)
}
