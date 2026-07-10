import AddIcon from '@mui/icons-material/Add'
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined'
import NetworkCheckOutlinedIcon from '@mui/icons-material/NetworkCheckOutlined'
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined'
import SettingsBrightnessOutlinedIcon from '@mui/icons-material/SettingsBrightnessOutlined'
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined'
import {
  Alert,
  Box,
  Button,
  IconButton,
  MenuItem,
  Slider,
  Snackbar,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CHECK_TIMEOUT_MAX_MS,
  CHECK_TIMEOUT_MIN_MS,
  SUPPORTED_LANGUAGES,
  type AppLanguage,
  type ThemeMode
} from '../../../shared/types/settings'
import ContentSection from '../components/ContentSection'
import LanguageFlag from '../components/LanguageFlag'
import { useSettingsStore } from '../store/settingsStore'
import { MD3_DURATION, MD3_EASING, surfaceContainer } from '../theme'
import { normalizeDomainInput, validateDomain } from '../validation/proxySchema'

const TIMEOUT_MARKS = [
  { value: 5, label: '5' },
  { value: 10, label: '10' },
  { value: 30, label: '30' },
  { value: 60, label: '60' },
  { value: 120, label: '120' }
]

function clampTimeoutSeconds(seconds: number): number {
  const minSec = CHECK_TIMEOUT_MIN_MS / 1000
  const maxSec = CHECK_TIMEOUT_MAX_MS / 1000
  return Math.min(maxSec, Math.max(minSec, Math.round(seconds)))
}

function SettingsPage(): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const { settings, setTheme, setLanguage, setCheckDomains, setCheckTimeoutMs } = useSettingsStore()
  const [domainInput, setDomainInput] = useState('')
  const [domainError, setDomainError] = useState<string | null>(null)
  const [savedOpen, setSavedOpen] = useState(false)
  const [timeoutDraft, setTimeoutDraft] = useState(settings.checkTimeoutMs / 1000)
  const [isDraggingTimeout, setIsDraggingTimeout] = useState(false)

  const timeoutSeconds = settings.checkTimeoutMs / 1000
  const displayedTimeout = isDraggingTimeout ? timeoutDraft : timeoutSeconds

  const notifySaved = (): void => {
    setSavedOpen(true)
  }

  const handleThemeChange = async (
    _event: React.MouseEvent<HTMLElement>,
    theme: ThemeMode | null
  ): Promise<void> => {
    if (!theme) return
    await setTheme(theme)
    notifySaved()
  }

  const handleLanguageChange = async (language: AppLanguage): Promise<void> => {
    await setLanguage(language)
    notifySaved()
  }

  const handleTimeoutChange = (_event: Event, value: number | number[]): void => {
    const seconds = Array.isArray(value) ? value[0] : value
    setIsDraggingTimeout(true)
    setTimeoutDraft(clampTimeoutSeconds(seconds))
  }

  const handleTimeoutCommit = async (): Promise<void> => {
    setIsDraggingTimeout(false)
    const nextTimeoutMs = timeoutDraft * 1000
    if (nextTimeoutMs === settings.checkTimeoutMs) return

    await setCheckTimeoutMs(nextTimeoutMs)
    notifySaved()
  }

  const handleAddDomain = async (): Promise<void> => {
    const error = validateDomain(domainInput, settings.checkDomains, t)
    if (error) {
      setDomainError(error)
      return
    }

    const domain = normalizeDomainInput(domainInput)
    await setCheckDomains([...settings.checkDomains, domain])
    setDomainInput('')
    setDomainError(null)
    notifySaved()
  }

  const handleRemoveDomain = async (domain: string): Promise<void> => {
    await setCheckDomains(settings.checkDomains.filter((item) => item !== domain))
    setDomainError(null)
    notifySaved()
  }

  return (
    <Box sx={{ maxWidth: 760, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        {t('settings.title')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3.5 }}>
        {t('settings.description')}
      </Typography>

      <Stack spacing={3}>
        <ContentSection
          icon={<PaletteOutlinedIcon fontSize="small" />}
          title={t('settings.sections.appearance')}
          description={t('settings.sections.appearanceDescription')}
        >
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1.25 }}>
                {t('settings.theme')}
              </Typography>
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
            </Box>

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
          </Stack>
        </ContentSection>

        <ContentSection
          icon={<NetworkCheckOutlinedIcon fontSize="small" />}
          title={t('settings.sections.checking')}
          description={t('settings.sections.checkingDescription')}
        >
          <Stack spacing={3}>
            <Box>
              <Stack
                direction="row"
                spacing={1}
                sx={{ mb: 1.25, alignItems: 'center', justifyContent: 'space-between' }}
              >
                <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                  <TimerOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="subtitle2">{t('settings.checkTimeout')}</Typography>
                </Stack>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 2,
                    bgcolor: surfaceContainer(theme, 'high'),
                    color: 'primary.main'
                  }}
                >
                  {t('settings.checkTimeoutValue', { value: displayedTimeout })}
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t('settings.checkTimeoutHint')}
              </Typography>
              <Slider
                value={displayedTimeout}
                onChange={handleTimeoutChange}
                onChangeCommitted={() => void handleTimeoutCommit()}
                min={CHECK_TIMEOUT_MIN_MS / 1000}
                max={CHECK_TIMEOUT_MAX_MS / 1000}
                step={1}
                marks={TIMEOUT_MARKS}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => t('settings.checkTimeoutValue', { value })}
                sx={{ px: 0.5 }}
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 0.75 }}>
                {t('settings.checkDomains')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t('settings.checkDomainsHint')}
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }}>
                <TextField
                  label={t('settings.addDomain')}
                  placeholder={t('settings.domainPlaceholder')}
                  value={domainInput}
                  onChange={(event) => {
                    setDomainInput(event.target.value)
                    setDomainError(null)
                  }}
                  error={Boolean(domainError)}
                  helperText={domainError}
                  fullWidth
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      void handleAddDomain()
                    }
                  }}
                />
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => void handleAddDomain()}
                  sx={{
                    minWidth: { sm: 140 },
                    alignSelf: { xs: 'stretch', sm: 'flex-start' },
                    mt: { sm: 0.25 }
                  }}
                >
                  {t('common.add')}
                </Button>
              </Stack>

              <Stack spacing={0.75}>
                {settings.checkDomains.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    {t('settings.checkDomainsEmpty')}
                  </Typography>
                ) : (
                  settings.checkDomains.map((domain) => (
                    <Box
                      key={domain}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        px: 1.5,
                        py: 1.1,
                        borderRadius: 2,
                        bgcolor: surfaceContainer(theme, 'low'),
                        transition: `background-color ${MD3_DURATION.short4}ms ${MD3_EASING.standard}, transform ${MD3_DURATION.short3}ms ${MD3_EASING.standard}`,
                        '&:hover': {
                          bgcolor: surfaceContainer(theme, 'default'),
                          transform: 'translateX(2px)'
                        }
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          flex: 1,
                          fontFamily: 'monospace',
                          fontWeight: 500,
                          wordBreak: 'break-all'
                        }}
                      >
                        {domain}
                      </Typography>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => void handleRemoveDomain(domain)}
                        aria-label={t('common.delete')}
                      >
                        <DeleteOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))
                )}
              </Stack>
            </Box>
          </Stack>
        </ContentSection>
      </Stack>

      <Snackbar
        open={savedOpen}
        autoHideDuration={2000}
        onClose={() => setSavedOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" onClose={() => setSavedOpen(false)}>
          {t('settings.saved')}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default SettingsPage
