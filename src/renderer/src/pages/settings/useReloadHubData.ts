import { useCallback } from 'react'
import { useGroupStore } from '../../store/groupStore'
import { useProxyStore } from '../../store/proxyStore'
import { useSettingsStore } from '../../store/settingsStore'
import { suppressSyncOnChange } from '../../utils/sync-on-change'

/**
 * Перезагружает прокси/группы/настройки из main-процесса после импорта
 * (backup, sync). Используется подстраницами Backup и Sync.
 */
export function useReloadHubData(): () => Promise<void> {
  const loadSettings = useSettingsStore((state) => state.loadSettings)

  return useCallback(async (): Promise<void> => {
    suppressSyncOnChange()

    const [proxies, groups] = await Promise.all([window.api.getProxies(), window.api.getGroups()])

    useProxyStore.setState({ proxies })
    useGroupStore.setState({ groups })
    await loadSettings()
  }, [loadSettings])
}
