import { useTranslation } from 'react-i18next'
import SettingsBackupSection from '../../components/SettingsBackupSection'
import { useGroupStore } from '../../store/groupStore'
import { useProxyStore } from '../../store/proxyStore'
import { useSettingsFeedback } from './useSettingsFeedback'
import { useReloadHubData } from './useReloadHubData'

function BackupPage(): React.JSX.Element {
  const { t } = useTranslation()
  const proxies = useProxyStore((state) => state.proxies)
  const groups = useGroupStore((state) => state.groups)
  const reloadHubData = useReloadHubData()
  const { notifyFeedback } = useSettingsFeedback()

  return (
    <SettingsBackupSection
      proxies={proxies}
      groups={groups}
      onExportSuccess={() => notifyFeedback(t('settings.backup.exportSuccess'))}
      onListExportSuccess={(format) => notifyFeedback(t(`settings.backup.${format}.exportSuccess`))}
      onImportSuccess={({ proxiesAdded, groupsAdded, settingsImported }) =>
        notifyFeedback(
          t('settings.backup.importSuccess', {
            proxies: proxiesAdded,
            groups: groupsAdded,
            settings: settingsImported ? t('settings.backup.importSuccessSettings') : ''
          })
        )
      }
      onListImportSuccess={({ format, proxiesAdded, skippedDuplicates }) =>
        notifyFeedback(
          t(`settings.backup.${format}.importSuccess`, {
            proxies: proxiesAdded,
            skipped:
              skippedDuplicates > 0
                ? t(`settings.backup.${format}.importSuccessSkipped`, {
                    skipped: skippedDuplicates
                  })
                : ''
          })
        )
      }
      onError={(message) => notifyFeedback(message, 'error')}
      onReloadData={reloadHubData}
    />
  )
}

export default BackupPage
