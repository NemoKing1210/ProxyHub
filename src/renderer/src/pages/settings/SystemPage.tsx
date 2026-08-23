import SystemSection from './sections/SystemSection'
import SettingsSectionHeader from './components/SettingsSectionHeader'
import { useSettingsStore } from '../../store/settingsStore'
import { useSettingsFeedback } from '../../hooks/useSettingsFeedback'

function SystemPage(): React.JSX.Element {
  const settings = useSettingsStore((state) => state.settings)
  const updateSettings = useSettingsStore((state) => state.updateSettings)
  const { notifySaved } = useSettingsFeedback()

  const handleTrayEnabledChange = async (enabled: boolean): Promise<void> => {
    // Reset startMinimized when the tray is disabled.
    await updateSettings({
      trayEnabled: enabled,
      startMinimized: enabled ? settings.startMinimized : false
    })
    notifySaved()
  }

  const handleStartMinimizedChange = async (enabled: boolean): Promise<void> => {
    await updateSettings({ startMinimized: enabled })
    notifySaved()
  }

  const handleLaunchAtLoginChange = async (enabled: boolean): Promise<void> => {
    await updateSettings({ launchAtLogin: enabled })
    notifySaved()
  }

  const handleBackgroundCheckNotificationsChange = async (enabled: boolean): Promise<void> => {
    await updateSettings({ backgroundCheckNotifications: enabled })
    notifySaved()
  }

  return (
    <>
      <SettingsSectionHeader />
      <SystemSection
        trayEnabled={settings.trayEnabled}
        startMinimized={settings.startMinimized}
        launchAtLogin={settings.launchAtLogin}
        backgroundCheckNotifications={settings.backgroundCheckNotifications}
        onTrayEnabledChange={(enabled) => void handleTrayEnabledChange(enabled)}
        onStartMinimizedChange={(enabled) => void handleStartMinimizedChange(enabled)}
        onLaunchAtLoginChange={(enabled) => void handleLaunchAtLoginChange(enabled)}
        onBackgroundCheckNotificationsChange={(enabled) =>
          void handleBackgroundCheckNotificationsChange(enabled)
        }
      />
    </>
  )
}

export default SystemPage
