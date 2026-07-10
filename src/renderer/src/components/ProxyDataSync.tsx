import { useEffect } from 'react'
import { useProxyStore } from '../store/proxyStore'

function ProxyDataSync(): null {
  const loadProxies = useProxyStore((state) => state.loadProxies)

  useEffect(() => {
    const unsubscribeProxies = window.api.onTrayProxiesUpdated(() => {
      void loadProxies()
    })
    const unsubscribeCheckAll = window.api.onCheckAllState((active) => {
      useProxyStore.setState({ isCheckingAll: active })
    })

    return () => {
      unsubscribeProxies()
      unsubscribeCheckAll()
    }
  }, [loadProxies])

  return null
}

export default ProxyDataSync
