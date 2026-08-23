import MinimizeOutlinedIcon from '@mui/icons-material/MinimizeOutlined'
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined'
import PowerSettingsNewOutlinedIcon from '@mui/icons-material/PowerSettingsNewOutlined'
import TabOutlinedIcon from '@mui/icons-material/TabOutlined'
import { Box, Collapse } from '@mui/material'
import { useTranslation } from 'react-i18next'
import ContentSection from '../../../components/ui/ContentSection'
import SettingsCardList from '../../../components/settings/SettingsCardList'
import SettingsSwitchCard from '../../../components/settings/SettingsSwitchCard'

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
      <ContentSection
        icon={<TabOutlinedIcon fontSize="small" />}
        title={t('settings.trayEnabled')}
        description={t('settings.trayEnabledHint')}
      >
        <SettingsSwitchCard
          icon={<TabOutlinedIcon fontSize="small" />}
          title={t('settings.trayEnabled')}
          hint={t('settings.trayEnabledHint')}
          checked={trayEnabled}
          onChange={onTrayEnabledChange}
          clickable
        />

        <Collapse in={trayEnabled} mountOnEnter unmountOnExit>
          <Box sx={{ mt: 0.75, ml: { xs: 1, sm: 2 } }}>
            <SettingsSwitchCard
              icon={<MinimizeOutlinedIcon fontSize="small" />}
              title={t('settings.startMinimized')}
              hint={t('settings.startMinimizedHint')}
              checked={startMinimized}
              onChange={onStartMinimizedChange}
              clickable
            />
          </Box>
        </Collapse>
      </ContentSection>

      <ContentSection
        icon={<PowerSettingsNewOutlinedIcon fontSize="small" />}
        title={t('settings.launchAtLogin')}
        description={t('settings.launchAtLoginHint')}
      >
        <SettingsSwitchCard
          icon={<PowerSettingsNewOutlinedIcon fontSize="small" />}
          title={t('settings.launchAtLogin')}
          hint={t('settings.launchAtLoginHint')}
          checked={launchAtLogin}
          onChange={onLaunchAtLoginChange}
          clickable
        />
      </ContentSection>

      <ContentSection
        icon={<NotificationsOutlinedIcon fontSize="small" />}
        title={t('settings.backgroundCheckNotifications')}
        description={t('settings.backgroundCheckNotificationsHint')}
      >
        <SettingsSwitchCard
          icon={<NotificationsOutlinedIcon fontSize="small" />}
          accent="info"
          title={t('settings.backgroundCheckNotifications')}
          hint={t('settings.backgroundCheckNotificationsHint')}
          checked={backgroundCheckNotifications}
          onChange={onBackgroundCheckNotificationsChange}
          clickable
        />
      </ContentSection>
    </SettingsCardList>
  )
}

export default SystemSection
