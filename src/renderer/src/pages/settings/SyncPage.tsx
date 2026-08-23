import SyncSection from './sections/SyncSection'
import { useSettingsFeedback } from '../../hooks/useSettingsFeedback'
import { useReloadHubData } from '../../hooks/useReloadHubData'

function SyncPage(): React.JSX.Element {
  const { notifySaved, notifyFeedback } = useSettingsFeedback()
  const reloadHubData = useReloadHubData()

  return (
    <SyncSection onSaved={notifySaved} onFeedback={notifyFeedback} onReloadData={reloadHubData} />
  )
}

export default SyncPage
