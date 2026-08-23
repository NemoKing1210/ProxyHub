import CheckIcon from '@mui/icons-material/Check'
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined'
import DragIndicatorOutlinedIcon from '@mui/icons-material/DragIndicatorOutlined'
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined'
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined'
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined'
import SettingsBrightnessOutlinedIcon from '@mui/icons-material/SettingsBrightnessOutlined'
import TranslateOutlinedIcon from '@mui/icons-material/TranslateOutlined'
import ViewAgendaOutlinedIcon from '@mui/icons-material/ViewAgendaOutlined'
import ViewCompactOutlinedIcon from '@mui/icons-material/ViewCompactOutlined'
import {
  Box,
  ButtonBase,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import {
  ACCENT_COLOR_OPTIONS,
  SUPPORTED_LANGUAGES,
  type AppLanguage,
  type ProxyCardViewMode,
  type ThemeMode,
  type ToastPosition
} from '@shared/types/settings'
import ContentSection from '../../components/ui/ContentSection'
import LanguageFlag from '../../components/ui/LanguageFlag'
import SettingsCardList from '../../components/settings/SettingsCardList'
import SettingsSwitchCard from '../../components/settings/SettingsSwitchCard'
import { MD3_DURATION, MD3_EASING, withThemeAlpha } from '../../theme'
import { useSettingsStore } from '../../store/settingsStore'
import { useSettingsFeedback } from './useSettingsFeedback'

function AppearancePage(): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const { notifySaved } = useSettingsFeedback()

  const settings = useSettingsStore((state) => state.settings)
  const setTheme = useSettingsStore((state) => state.setTheme)
  const setLanguage = useSettingsStore((state) => state.setLanguage)
  const updateSettings = useSettingsStore((state) => state.updateSettings)

  const selectedAccentColor =
    ACCENT_COLOR_OPTIONS.find((option) => option.value === settings.accentColor) ??
    ACCENT_COLOR_OPTIONS[0]

  const handleThemeChange = async (
    _event: React.MouseEvent<HTMLElement>,
    nextTheme: ThemeMode | null
  ): Promise<void> => {
    if (!nextTheme || nextTheme === settings.theme) return

    await setTheme(nextTheme)
    notifySaved()
  }

  const handleAccentColorChange = async (accentColor: string): Promise<void> => {
    if (accentColor === settings.accentColor) return

    await updateSettings({ accentColor })
    notifySaved()
  }

  const handleProxyCardViewChange = async (
    _event: React.MouseEvent<HTMLElement>,
    view: ProxyCardViewMode | null
  ): Promise<void> => {
    if (!view || view === settings.proxyCardView) return

    await updateSettings({ proxyCardView: view })
    notifySaved()
  }

  const handleProxyDragEnabledChange = async (enabled: boolean): Promise<void> => {
    await updateSettings({ proxyDragEnabled: enabled })
    notifySaved()
  }

  const handleToastEnabledChange = async (enabled: boolean): Promise<void> => {
    await updateSettings({ toastEnabled: enabled })
    notifySaved()
  }

  const handleToastPositionChange = async (position: ToastPosition): Promise<void> => {
    await updateSettings({ toastPosition: position })
    notifySaved()
  }

  const handleLanguageChange = async (language: AppLanguage): Promise<void> => {
    await setLanguage(language)
    notifySaved()
  }

  return (
    <SettingsCardList>
      <ContentSection
        icon={<PaletteOutlinedIcon fontSize="small" />}
        title={t('settings.appearanceThemeGroup')}
        description={t('settings.theme')}
      >
        <ToggleButtonGroup
          value={settings.theme}
          exclusive
          onChange={(event, value) => void handleThemeChange(event, value)}
          fullWidth
          sx={{
            '& .MuiToggleButton-root': {
              py: 1.35,
              gap: 0.75
            }
          }}
        >
          <ToggleButton value="light">
            <LightModeOutlinedIcon fontSize="small" />
            {t('settings.themeLight')}
          </ToggleButton>
          <ToggleButton value="dark">
            <DarkModeOutlinedIcon fontSize="small" />
            {t('settings.themeDark')}
          </ToggleButton>
          <ToggleButton value="system">
            <SettingsBrightnessOutlinedIcon fontSize="small" />
            {t('settings.themeSystem')}
          </ToggleButton>
        </ToggleButtonGroup>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          sx={{
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            mt: 2.5
          }}
        >
          <Box>
            <Typography variant="subtitle2">{t('settings.accentColor')}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {t('settings.accentColorHint')}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Box
              aria-hidden
              sx={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                bgcolor: selectedAccentColor.value,
                boxShadow: `0 0 0 2px ${theme.palette.background.default}, 0 0 0 3px ${selectedAccentColor.value}`
              }}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontFamily: 'monospace', letterSpacing: '0.04em' }}
            >
              {selectedAccentColor.value.toUpperCase()}
            </Typography>
          </Stack>
        </Stack>

        <Box
          role="radiogroup"
          aria-label={t('settings.accentColor')}
          sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}
        >
          {ACCENT_COLOR_OPTIONS.map((option) => {
            const selected = settings.accentColor === option.value

            return (
              <Tooltip key={option.id} title={t(`settings.accentColorOptions.${option.id}`)} arrow>
                <ButtonBase
                  component="button"
                  type="button"
                  onClick={() => void handleAccentColorChange(option.value)}
                  aria-label={t(`settings.accentColorOptions.${option.id}`)}
                  role="radio"
                  aria-checked={selected}
                  sx={{
                    position: 'relative',
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    border: '2px solid',
                    borderColor: selected
                      ? option.value
                      : withThemeAlpha(theme, theme.palette.text.primary, 0.14),
                    bgcolor: selected ? withThemeAlpha(theme, option.value, 0.12) : 'transparent',
                    transition: `background-color ${MD3_DURATION.short4}ms ${MD3_EASING.standard}, border-color ${MD3_DURATION.short4}ms ${MD3_EASING.standard}`,
                    '&:hover': {
                      bgcolor: withThemeAlpha(theme, option.value, 0.12),
                      borderColor: option.value
                    },
                    '&:focus-visible': {
                      outline: `3px solid ${withThemeAlpha(theme, option.value, 0.4)}`,
                      outlineOffset: 2,
                      zIndex: 1
                    }
                  }}
                >
                  <Box
                    aria-hidden
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      bgcolor: option.value,
                      boxShadow: `inset 0 0 0 1px ${withThemeAlpha(theme, theme.palette.common.white, 0.2)}`
                    }}
                  />
                  {selected ? (
                    <CheckIcon
                      sx={{
                        position: 'absolute',
                        fontSize: 15,
                        color: 'common.white',
                        filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.28))'
                      }}
                    />
                  ) : null}
                </ButtonBase>
              </Tooltip>
            )
          })}
        </Box>
      </ContentSection>

      <ContentSection
        icon={<ViewAgendaOutlinedIcon fontSize="small" />}
        title={t('settings.appearanceCardsGroup')}
        description={t('settings.proxyCardView')}
      >
        <ToggleButtonGroup
          value={settings.proxyCardView}
          exclusive
          onChange={(event, value) => void handleProxyCardViewChange(event, value)}
          fullWidth
          sx={{
            '& .MuiToggleButton-root': {
              py: 1.35,
              gap: 0.75
            }
          }}
        >
          <ToggleButton value="standard">
            <ViewAgendaOutlinedIcon fontSize="small" />
            {t('settings.proxyCardViewStandard')}
          </ToggleButton>
          <ToggleButton value="compact">
            <ViewCompactOutlinedIcon fontSize="small" />
            {t('settings.proxyCardViewCompact')}
          </ToggleButton>
        </ToggleButtonGroup>

        <Box sx={{ mt: 2 }}>
          <SettingsSwitchCard
            icon={<DragIndicatorOutlinedIcon fontSize="small" />}
            title={t('settings.proxyDragEnabled')}
            hint={t('settings.proxyDragEnabledHint')}
            checked={settings.proxyDragEnabled}
            onChange={(enabled) => void handleProxyDragEnabledChange(enabled)}
            clickable
          />
        </Box>
      </ContentSection>

      <ContentSection
        icon={<NotificationsOutlinedIcon fontSize="small" />}
        title={t('settings.appearanceNotificationsGroup')}
        description={t('settings.toastEnabledHint')}
      >
        <SettingsSwitchCard
          icon={<NotificationsOutlinedIcon fontSize="small" />}
          title={t('settings.toastEnabled')}
          hint={t('settings.toastEnabledHint')}
          checked={settings.toastEnabled}
          onChange={(enabled) => void handleToastEnabledChange(enabled)}
          clickable
        />

        <TextField
          select
          fullWidth
          label={t('settings.toastPosition')}
          value={settings.toastPosition}
          disabled={!settings.toastEnabled}
          onChange={(event) => void handleToastPositionChange(event.target.value as ToastPosition)}
          sx={{ mt: 1.5 }}
        >
          <MenuItem value="top-left">{t('settings.toastPositionTopLeft')}</MenuItem>
          <MenuItem value="top-center">{t('settings.toastPositionTopCenter')}</MenuItem>
          <MenuItem value="top-right">{t('settings.toastPositionTopRight')}</MenuItem>
          <MenuItem value="bottom-left">{t('settings.toastPositionBottomLeft')}</MenuItem>
          <MenuItem value="bottom-center">{t('settings.toastPositionBottomCenter')}</MenuItem>
          <MenuItem value="bottom-right">{t('settings.toastPositionBottomRight')}</MenuItem>
        </TextField>
      </ContentSection>

      <ContentSection
        icon={<TranslateOutlinedIcon fontSize="small" />}
        title={t('settings.appearanceLanguageGroup')}
        description={t('settings.language')}
      >
        <TextField
          select
          label={t('settings.language')}
          value={settings.language}
          onChange={(event) => void handleLanguageChange(event.target.value as AppLanguage)}
          fullWidth
          slotProps={{
            select: {
              renderValue: (selected) => {
                const language = SUPPORTED_LANGUAGES.find((item) => item.code === selected)
                if (!language) return null

                return (
                  <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                    <LanguageFlag language={language.code} />
                    <span>{language.label}</span>
                  </Stack>
                )
              }
            }
          }}
        >
          {SUPPORTED_LANGUAGES.map((language) => (
            <MenuItem key={language.code} value={language.code}>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                <LanguageFlag language={language.code} />
                <span>{language.label}</span>
              </Stack>
            </MenuItem>
          ))}
        </TextField>
      </ContentSection>
    </SettingsCardList>
  )
}

export default AppearancePage
