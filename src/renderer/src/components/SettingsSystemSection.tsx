import MinimizeOutlinedIcon from '@mui/icons-material/MinimizeOutlined'
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined'
import PowerSettingsNewOutlinedIcon from '@mui/icons-material/PowerSettingsNewOutlined'
import TabOutlinedIcon from '@mui/icons-material/TabOutlined'
import WidgetsOutlinedIcon from '@mui/icons-material/WidgetsOutlined'
import { Box, Collapse, Stack } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import ContentSection from './ContentSection'
import SettingsSwitchCard from './SettingsSwitchCard'
import { MD3_DURATION, MD3_EASING, outlineVariant, surfaceContainer } from '../theme'

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
  const theme = useTheme()

  return (
    <ContentSection
      icon={<WidgetsOutlinedIcon fontSize="small" />}
      title={t('settings.sections.system')}
      description={t('settings.sections.systemDescription')}
      collapsible
      defaultExpanded={false}
    >
      <Stack spacing={2}>
        <Box
          sx={{
            borderRadius: 2.5,
            overflow: 'hidden',
            bgcolor: surfaceContainer(theme, 'low'),
            boxShadow: `inset 0 0 0 1px ${outlineVariant(theme)}`,
            transition: `box-shadow ${MD3_DURATION.short4}ms ${MD3_EASING.standard}`
          }}
        >
          <SettingsSwitchCard
            icon={<TabOutlinedIcon fontSize="small" />}
            title={t('settings.trayEnabled')}
            hint={t('settings.trayEnabledHint')}
            checked={trayEnabled}
            onChange={onTrayEnabledChange}
          />

          <Collapse in={trayEnabled} unmountOnExit>
            <Box
              sx={{
                borderTop: `1px solid ${outlineVariant(theme)}`,
                bgcolor: surfaceContainer(theme, 'default')
              }}
            >
              <SettingsSwitchCard
                icon={<MinimizeOutlinedIcon fontSize="small" />}
                title={t('settings.startMinimized')}
                hint={t('settings.startMinimizedHint')}
                checked={startMinimized}
                onChange={onStartMinimizedChange}
              />
            </Box>
          </Collapse>
        </Box>

        <Box
          sx={{
            borderRadius: 2.5,
            overflow: 'hidden',
            bgcolor: surfaceContainer(theme, 'low'),
            boxShadow: `inset 0 0 0 1px ${outlineVariant(theme)}`
          }}
        >
          <SettingsSwitchCard
            icon={<PowerSettingsNewOutlinedIcon fontSize="small" />}
            title={t('settings.launchAtLogin')}
            hint={t('settings.launchAtLoginHint')}
            checked={launchAtLogin}
            onChange={onLaunchAtLoginChange}
          />
        </Box>

        <Box
          sx={{
            borderRadius: 2.5,
            overflow: 'hidden',
            bgcolor: surfaceContainer(theme, 'low'),
            boxShadow: `inset 0 0 0 1px ${outlineVariant(theme)}`
          }}
        >
          <SettingsSwitchCard
            icon={<NotificationsOutlinedIcon fontSize="small" />}
            accent="info"
            title={t('settings.backgroundCheckNotifications')}
            hint={t('settings.backgroundCheckNotificationsHint')}
            checked={backgroundCheckNotifications}
            onChange={onBackgroundCheckNotificationsChange}
          />
        </Box>
      </Stack>
    </ContentSection>
  )
}

export default SettingsSystemSection
