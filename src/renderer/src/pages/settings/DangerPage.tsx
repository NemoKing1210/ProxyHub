import { useTranslation } from 'react-i18next'
import SettingsDangerSection from '../../components/SettingsDangerSection'
import { useGroupStore } from '../../store/groupStore'
import { useProxyStore } from '../../store/proxyStore'
import { useSettingsStore } from '../../store/settingsStore'
import { notifySyncDataChange } from '../../utils/sync-on-change'
import { useSettingsFeedback } from './useSettingsFeedback'

function DangerPage(): React.JSX.Element {
  const { t } = useTranslation()
  const proxies = useProxyStore((state) => state.proxies)
  const groups = useGroupStore((state) => state.groups)
  const isCheckingAll = useProxyStore((state) => state.isCheckingAll)
  const isChecking = useProxyStore((state) => state.checkingIds.size > 0)
  const setDetailsProxyId = useProxyStore((state) => state.setDetailsProxyId)
  const resetSettings = useSettingsStore((state) => state.resetSettings)
  const { notifyFeedback } = useSettingsFeedback()

  const isDangerActionsDisabled = isCheckingAll || isChecking

  const handleDeleteAllProxiesAndGroups = async (): Promise<void> => {
    await Promise.all([window.api.saveProxies([]), window.api.saveGroups([])])
    notifySyncDataChange('proxies')

    useProxyStore.setState({
      proxies: [],
      checkingIds: new Set(),
      isCheckingAll: false,
      isAutoChecking: false
    })
    setDetailsProxyId(null)
    useGroupStore.setState({ groups: [] })

    notifyFeedback(t('settings.dangerZone.deleteAllSuccess'))
  }

  const handleResetSettings = async (): Promise<void> => {
    await resetSettings()
    notifyFeedback(t('settings.dangerZone.resetSettingsSuccess'))
  }

  return (
    <SettingsDangerSection
      proxyCount={proxies.length}
      groupCount={groups.length}
      disabled={isDangerActionsDisabled}
      onDeleteAll={handleDeleteAllProxiesAndGroups}
      onResetSettings={handleResetSettings}
    />
  )
}

export default DangerPage
