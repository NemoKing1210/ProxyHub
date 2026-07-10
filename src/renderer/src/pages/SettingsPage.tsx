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
import { alpha, useTheme } from '@mui/material/styles'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CHECK_TIMEOUT_MAX_MS,
  CHECK_TIMEOUT_MIN_MS,
  SUPPORTED_LANGUAGES,
  type AppLanguage,
  type ThemeMode
} from '../../../shared/types/settings'
import ContentSection from '../components/ContentSection'
import { useSettingsStore } from '../store/settingsStore'
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

  const timeoutSeconds = settings.checkTimeoutMs / 1000

  useEffect(() => {
    setTimeoutDraft(timeoutSeconds)
  }, [timeoutSeconds])

  const notifySaved = (): void => {
    setSavedOpen(true)
  }

  const handleThemeChange = async (_event: React.MouseEvent<HTMLElement>, theme: ThemeMode | null): Promise<void> => {
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
    setTimeoutDraft(clampTimeoutSeconds(seconds))
  }

  const handleTimeoutCommit = async (): Promise<void> => {
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
    if (settings.checkDomains.length <= 1) {
      setDomainError(t('settings.domainRequired'))
      return
    }

    await setCheckDomains(settings.checkDomains.filter((item) => item !== domain))
    setDomainError(null)
    notifySaved()
  }

  return (
    <Box sx={{ maxWidth: 760, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
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
              <Typography variant="subtitle2" sx={{ mb: 1.25, fontWeight: 600 }}>
                {t('settings.theme')}
              </Typography>
              <ToggleButtonGroup
                value={settings.theme}
                exclusive
                onChange={(event, value) => void handleThemeChange(event, value)}
                fullWidth
                sx={{
                  '& .MuiToggleButton-root': {
                    py: 1.25,
                    textTransform: 'none',
                    fontWeight: 500,
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
            >
              {SUPPORTED_LANGUAGES.map((language) => (
                <MenuItem key={language.code} value={language.code}>
                  {language.label}
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
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {t('settings.checkTimeout')}
                  </Typography>
                </Stack>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    px: 1.25,
                    py: 0.35,
                    borderRadius: 1,
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                    color: 'primary.main'
                  }}
                >
                  {t('settings.checkTimeoutValue', { value: timeoutDraft })}
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t('settings.checkTimeoutHint')}
              </Typography>
              <Slider
                value={timeoutDraft}
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
              <Typography variant="subtitle2" sx={{ mb: 0.75, fontWeight: 600 }}>
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
                  sx={{ minWidth: { sm: 140 }, alignSelf: { xs: 'stretch', sm: 'flex-start' }, mt: { sm: 0.25 } }}
                >
                  {t('common.add')}
                </Button>
              </Stack>

              <Stack spacing={0.75}>
                {settings.checkDomains.map((domain) => (
                  <Box
                    key={domain}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      px: 1.5,
                      py: 1,
                      borderRadius: 1.5,
                      bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.08 : 0.05),
                      transition: 'background-color 0.2s ease',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.14 : 0.09)
                      }
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ flex: 1, fontFamily: 'monospace', fontWeight: 500, wordBreak: 'break-all' }}
                    >
                      {domain}
                    </Typography>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => void handleRemoveDomain(domain)}
                      disabled={settings.checkDomains.length <= 1}
                      aria-label={t('common.delete')}
                    >
                      <DeleteOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
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
