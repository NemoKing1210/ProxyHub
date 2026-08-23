import AutoCheckSection from './sections/AutoCheckSection'
import type { AutoCheckScope } from '@shared/types/settings'
import { useGroupStore } from '../../store/groupStore'
import { useProxyStore } from '../../store/proxyStore'
import { useSettingsStore } from '../../store/settingsStore'

function AutoCheckPage(): React.JSX.Element {
  const settings = useSettingsStore((state) => state.settings)
  const updateSettings = useSettingsStore((state) => state.updateSettings)
  const groups = useGroupStore((state) => state.groups)
  const favoriteCount = useProxyStore(
    (state) => state.proxies.filter((proxy) => proxy.isFavorite).length
  )

  const handleAutoCheckEnabledChange = async (enabled: boolean): Promise<void> => {
    await updateSettings({ autoCheckEnabled: enabled })
  }

  const handleAutoCheckIntervalChange = async (minutes: number): Promise<void> => {
    await updateSettings({ autoCheckIntervalMinutes: minutes })
  }

  const handleAutoCheckNotificationsChange = async (enabled: boolean): Promise<void> => {
    await updateSettings({ autoCheckNotifications: enabled })
  }

  const handleAutoCheckScopeChange = async (scope: AutoCheckScope): Promise<void> => {
    await updateSettings({
      autoCheckScope: scope,
      autoCheckGroupIds: scope === 'groups' ? settings.autoCheckGroupIds : []
    })
  }

  const handleAutoCheckGroupIdsChange = async (groupIds: string[]): Promise<void> => {
    await updateSettings({ autoCheckGroupIds: groupIds })
  }

  return (
    <AutoCheckSection
      enabled={settings.autoCheckEnabled}
      intervalMinutes={settings.autoCheckIntervalMinutes}
      notifications={settings.autoCheckNotifications}
      scope={settings.autoCheckScope}
      groupIds={settings.autoCheckGroupIds}
      groups={groups}
      favoriteCount={favoriteCount}
      onEnabledChange={(enabled) => void handleAutoCheckEnabledChange(enabled)}
      onIntervalChange={(minutes) => void handleAutoCheckIntervalChange(minutes)}
      onNotificationsChange={(enabled) => void handleAutoCheckNotificationsChange(enabled)}
      onScopeChange={(scope) => void handleAutoCheckScopeChange(scope)}
      onGroupIdsChange={(groupIds) => void handleAutoCheckGroupIdsChange(groupIds)}
    />
  )
}

export default AutoCheckPage
