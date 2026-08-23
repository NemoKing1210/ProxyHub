import SettingsSyncSection from '../../components/SettingsSyncSection'
import { useSettingsFeedback } from './useSettingsFeedback'
import { useReloadHubData } from './useReloadHubData'

function SyncPage(): React.JSX.Element {
  const { notifySaved, notifyFeedback } = useSettingsFeedback()
  const reloadHubData = useReloadHubData()

  return (
    <SettingsSyncSection
      onSaved={notifySaved}
      onFeedback={notifyFeedback}
      onReloadData={reloadHubData}
    />
  )
}

export default SyncPage
