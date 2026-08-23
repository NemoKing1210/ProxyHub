import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { AppRoute } from '@shared/types/settings'
import { useSettingsStore } from '../store/settingsStore'

const VALID_ROUTES: ReadonlySet<AppRoute> = new Set(['/', '/settings'])

function isAppRoute(pathname: string): pathname is AppRoute {
  return VALID_ROUTES.has(pathname as AppRoute)
}

function RoutePersistenceSync(): null {
  const location = useLocation()
  const navigate = useNavigate()
  const lastRoute = useSettingsStore((state) => state.settings.lastRoute)
  const updateSettings = useSettingsStore((state) => state.updateSettings)
  const hasRestoredRef = useRef(false)
  const skipNextPersistRef = useRef(true)

  useLayoutEffect(() => {
    if (hasRestoredRef.current) {
      return
    }

    hasRestoredRef.current = true

    if (lastRoute !== location.pathname) {
      navigate(lastRoute, { replace: true })
      return
    }

    skipNextPersistRef.current = false
  }, [lastRoute, location.pathname, navigate])

  useEffect(() => {
    if (!isAppRoute(location.pathname)) {
      return
    }

    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false
      return
    }

    if (lastRoute !== location.pathname) {
      void updateSettings({ lastRoute: location.pathname })
    }
  }, [location.pathname, lastRoute, updateSettings])

  return null
}

export default RoutePersistenceSync
