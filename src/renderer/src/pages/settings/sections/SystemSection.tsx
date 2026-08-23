import MinimizeOutlinedIcon from '@mui/icons-material/MinimizeOutlined'
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined'
import PowerSettingsNewOutlinedIcon from '@mui/icons-material/PowerSettingsNewOutlined'
import TabOutlinedIcon from '@mui/icons-material/TabOutlined'
import { Box } from '@mui/material'
import { useTranslation } from 'react-i18next'
import RevealCollapse from '../../../components/ui/RevealCollapse'
import SettingsCardList from '../../../components/settings/SettingsCardList'
import SettingsSwitchCard from '../../../components/settings/SettingsSwitchCard'
import SettingsSwitchSection from '../../../components/settings/SettingsSwitchSection'

interface SystemSectionProps {
  trayEnabled: boolean
  startMinimized: boolean
  launchAtLogin: boolean
  backgroundCheckNotifications: boolean
  onTrayEnabledChange: (enabled: boolean) => void
  onStartMinimizedChange: (enabled: boolean) => void
  onLaunchAtLoginChange: (enabled: boolean) => void
  onBackgroundCheckNotificationsChange: (enabled: boolean) => void
}

function SystemSection({
  trayEnabled,
  startMinimized,
  launchAtLogin,
  backgroundCheckNotifications,
  onTrayEnabledChange,
  onStartMinimizedChange,
  onLaunchAtLoginChange,
  onBackgroundCheckNotificationsChange
}: SystemSectionProps): React.JSX.Element {
  const { t } = useTranslation()

  return (
    <SettingsCardList>
      <SettingsSwitchSection
        icon={<TabOutlinedIcon fontSize="small" />}
        title={t('settings.trayEnabled')}
        description={t('settings.trayEnabledHint')}
        checked={trayEnabled}
        onChange={onTrayEnabledChange}
      >
        <RevealCollapse in={trayEnabled}>
          <Box>
            <SettingsSwitchCard
              icon={<MinimizeOutlinedIcon fontSize="small" />}
              title={t('settings.startMinimized')}
              hint={t('settings.startMinimizedHint')}
              checked={startMinimized}
              onChange={onStartMinimizedChange}
              clickable
            />
          </Box>
        </RevealCollapse>
      </SettingsSwitchSection>

      <SettingsSwitchSection
        icon={<PowerSettingsNewOutlinedIcon fontSize="small" />}
        title={t('settings.launchAtLogin')}
        description={t('settings.launchAtLoginHint')}
        checked={launchAtLogin}
        onChange={onLaunchAtLoginChange}
      />

      <SettingsSwitchSection
        icon={<NotificationsOutlinedIcon fontSize="small" />}
        accent="info"
        title={t('settings.backgroundCheckNotifications')}
        description={t('settings.backgroundCheckNotificationsHint')}
        checked={backgroundCheckNotifications}
        onChange={onBackgroundCheckNotificationsChange}
      />
    </SettingsCardList>
  )
}

export default SystemSection
