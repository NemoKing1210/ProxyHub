import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface TrayNavigationSyncProps {
  onOpenProxy: (proxyId: string) => void
}

function TrayNavigationSync({ onOpenProxy }: TrayNavigationSyncProps): null {
  const navigate = useNavigate()

  useEffect(() => {
    return window.api.onOpenProxyFromTray((proxyId) => {
      navigate('/')
      onOpenProxy(proxyId)
    })
  }, [navigate, onOpenProxy])

  return null
}

export default TrayNavigationSync
