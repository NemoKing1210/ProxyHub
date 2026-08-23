import SettingsSystemSection from '../../components/SettingsSystemSection'
import { useSettingsStore } from '../../store/settingsStore'
import { useSettingsFeedback } from './useSettingsFeedback'

function SystemPage(): React.JSX.Element {
  const settings = useSettingsStore((state) => state.settings)
  const updateSettings = useSettingsStore((state) => state.updateSettings)
  const { notifySaved } = useSettingsFeedback()

  const handleTrayEnabledChange = async (enabled: boolean): Promise<void> => {
    // При выключении трея связанный флаг автозапуска свёрнутым сбрасывается.
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
    <SettingsSystemSection
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
  )
}

export default SystemPage
