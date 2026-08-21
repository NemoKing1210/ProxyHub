import MinimizeOutlinedIcon from '@mui/icons-material/MinimizeOutlined'
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined'
import PowerSettingsNewOutlinedIcon from '@mui/icons-material/PowerSettingsNewOutlined'
import TabOutlinedIcon from '@mui/icons-material/TabOutlined'
import WidgetsOutlinedIcon from '@mui/icons-material/WidgetsOutlined'
import { Box, Collapse, Stack } from '@mui/material'
import { useTranslation } from 'react-i18next'
import ContentSection from './ContentSection'
import SettingsSwitchCard from './SettingsSwitchCard'

interface SettingsSystemSectionProps {
  trayEnabled: boolean
  startMinimized: boolean
  launchAtLogin: boolean
  backgroundCheckNotifications: boolean
  onTrayEnabledChange: (enabled: boolean) => void
  onStartMinimizedChange: (enabled: boolean) => void
  onLaunchAtLoginChange: (enabled: boolean) => void
  onBackgroundCheckNotificationsChange: (enabled: boolean) => void
}

function SettingsSystemSection({
  trayEnabled,
  startMinimized,
  launchAtLogin,
  backgroundCheckNotifications,
  onTrayEnabledChange,
  onStartMinimizedChange,
  onLaunchAtLoginChange,
  onBackgroundCheckNotificationsChange
}: SettingsSystemSectionProps): React.JSX.Element {
  const { t } = useTranslation()

  return (
    <ContentSection
      icon={<WidgetsOutlinedIcon fontSize="small" />}
      title={t('settings.sections.system')}
      description={t('settings.sections.systemDescription')}
      showHeader={false}
    >
      <Stack spacing={1.5}>
        <Box>
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
        </Box>

        <Box>
          <SettingsSwitchCard
            icon={<PowerSettingsNewOutlinedIcon fontSize="small" />}
            title={t('settings.launchAtLogin')}
            hint={t('settings.launchAtLoginHint')}
            checked={launchAtLogin}
            onChange={onLaunchAtLoginChange}
            clickable
          />
        </Box>

        <Box>
          <SettingsSwitchCard
            icon={<NotificationsOutlinedIcon fontSize="small" />}
            accent="info"
            title={t('settings.backgroundCheckNotifications')}
            hint={t('settings.backgroundCheckNotificationsHint')}
            checked={backgroundCheckNotifications}
            onChange={onBackgroundCheckNotificationsChange}
            clickable
          />
        </Box>
      </Stack>
    </ContentSection>
  )
}

export default SettingsSystemSection
