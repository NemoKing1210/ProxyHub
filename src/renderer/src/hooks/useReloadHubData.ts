import { useCallback } from 'react'
import { useGroupStore } from '../store/groupStore'
import { useProxyStore } from '../store/proxyStore'
import { useSettingsStore } from '../store/settingsStore'
import { suppressSyncOnChange } from '../services/sync-on-change'

/**
 * Reloads proxies/groups/settings from the main process after an import
 * (backup, sync). Used by the Backup and Sync subpages.
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
