import AddIcon from '@mui/icons-material/Add'
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay'
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined'
import ReorderOutlinedIcon from '@mui/icons-material/ReorderOutlined'
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined'
import {
  Box,
  Button,
  FormControlLabel,
  IconButton,
  Slider,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CHECK_ALL_CONCURRENCY_MAX,
  CHECK_ALL_CONCURRENCY_MIN,
  CHECK_TIMEOUT_MAX_MS,
  CHECK_TIMEOUT_MIN_MS,
  DOMAIN_CHECK_CONCURRENCY_MAX,
  DOMAIN_CHECK_CONCURRENCY_MIN,
  type CheckAllMode,
  getEnabledCheckDomains
} from '@shared/types/settings'
import ContentSection from '../../components/ui/ContentSection'
import SettingsCardList from '../../components/settings/SettingsCardList'
import { useSettingsStore } from '../../store/settingsStore'
import { MD3_DURATION, MD3_EASING, surfaceContainer } from '../../theme'
import { normalizeDomainInput, validateDomain } from '../../lib/proxy-schema'
import { useSettingsFeedback } from '../../hooks/useSettingsFeedback'

const TIMEOUT_MARKS = [
  { value: 5, label: '5' },
  { value: 10, label: '10' },
  { value: 30, label: '30' },
  { value: 60, label: '60' },
  { value: 120, label: '120' }
]

const CONCURRENCY_MARKS = [
  { value: 2, label: '2' },
  { value: 5, label: '5' },
  { value: 10, label: '10' },
  { value: 20, label: '20' }
]

const DOMAIN_CONCURRENCY_MARKS = [
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 5, label: '5' }
]

function clampConcurrency(value: number): number {
  return Math.min(CHECK_ALL_CONCURRENCY_MAX, Math.max(CHECK_ALL_CONCURRENCY_MIN, Math.round(value)))
}

function clampDomainConcurrency(value: number): number {
  return Math.min(
    DOMAIN_CHECK_CONCURRENCY_MAX,
    Math.max(DOMAIN_CHECK_CONCURRENCY_MIN, Math.round(value))
  )
}

function clampTimeoutSeconds(seconds: number): number {
  const minSec = CHECK_TIMEOUT_MIN_MS / 1000
  const maxSec = CHECK_TIMEOUT_MAX_MS / 1000
  return Math.min(maxSec, Math.max(minSec, Math.round(seconds)))
}

function CheckingPage(): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const { notifySaved } = useSettingsFeedback()

  const settings = useSettingsStore((state) => state.settings)
  const setCheckDomains = useSettingsStore((state) => state.setCheckDomains)
  const setCheckTimeoutMs = useSettingsStore((state) => state.setCheckTimeoutMs)
  const updateSettings = useSettingsStore((state) => state.updateSettings)

  const [domainInput, setDomainInput] = useState('')
  const [domainError, setDomainError] = useState<string | null>(null)
  const [timeoutDraft, setTimeoutDraft] = useState(settings.checkTimeoutMs / 1000)
  const [isDraggingTimeout, setIsDraggingTimeout] = useState(false)
  const [concurrencyDraft, setConcurrencyDraft] = useState(settings.checkAllConcurrency)
  const [isDraggingConcurrency, setIsDraggingConcurrency] = useState(false)
  const [domainConcurrencyDraft, setDomainConcurrencyDraft] = useState(
    settings.domainCheckConcurrency
  )
  const [isDraggingDomainConcurrency, setIsDraggingDomainConcurrency] = useState(false)

  const displayedTimeout = isDraggingTimeout ? timeoutDraft : settings.checkTimeoutMs / 1000
  const displayedConcurrency = isDraggingConcurrency
    ? concurrencyDraft
    : settings.checkAllConcurrency
  const displayedDomainConcurrency = isDraggingDomainConcurrency
    ? domainConcurrencyDraft
    : settings.domainCheckConcurrency

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

  const handleCheckAllModeChange = async (
    _event: React.MouseEvent<HTMLElement>,
    mode: CheckAllMode | null
  ): Promise<void> => {
    if (!mode || mode === settings.checkAllMode) return

    await updateSettings({ checkAllMode: mode })
    notifySaved()
  }

  const handleConcurrencyChange = (_event: Event, value: number | number[]): void => {
    const nextValue = Array.isArray(value) ? value[0] : value
    setIsDraggingConcurrency(true)
    setConcurrencyDraft(clampConcurrency(nextValue))
  }

  const handleConcurrencyCommit = async (): Promise<void> => {
    setIsDraggingConcurrency(false)
    if (concurrencyDraft === settings.checkAllConcurrency) return

    await updateSettings({ checkAllConcurrency: concurrencyDraft })
    notifySaved()
  }

  const handleDomainConcurrencyChange = (_event: Event, value: number | number[]): void => {
    const nextValue = Array.isArray(value) ? value[0] : value
    setIsDraggingDomainConcurrency(true)
    setDomainConcurrencyDraft(clampDomainConcurrency(nextValue))
  }

  const handleDomainConcurrencyCommit = async (): Promise<void> => {
    setIsDraggingDomainConcurrency(false)
    if (domainConcurrencyDraft === settings.domainCheckConcurrency) return

    await updateSettings({ domainCheckConcurrency: domainConcurrencyDraft })
    notifySaved()
  }

  const handleFetchExternalIpChange = async (enabled: boolean): Promise<void> => {
    await updateSettings({ fetchExternalIp: enabled })
    notifySaved()
  }

  const handleAddDomain = async (): Promise<void> => {
    const error = validateDomain(domainInput, settings.checkDomains, t)
    if (error) {
      setDomainError(error)
      return
    }

    const domain = normalizeDomainInput(domainInput)
    await setCheckDomains([...settings.checkDomains, { domain, enabled: true }])
    setDomainInput('')
    setDomainError(null)
    notifySaved()
  }

  const handleRemoveDomain = async (domain: string): Promise<void> => {
    await setCheckDomains(settings.checkDomains.filter((item) => item.domain !== domain))
    setDomainError(null)
    notifySaved()
  }

  const handleToggleDomain = async (domain: string, enabled: boolean): Promise<void> => {
    await setCheckDomains(
      settings.checkDomains.map((item) => (item.domain === domain ? { ...item, enabled } : item))
    )
    notifySaved()
  }

  return (
    <SettingsCardList>
      <ContentSection
        icon={<TimerOutlinedIcon fontSize="small" />}
        title={t('settings.checkTimeout')}
        description={t('settings.checkTimeoutHint')}
      >
        <Typography
          variant="body2"
          sx={{
            fontWeight: 700,
            fontFamily: 'monospace',
            px: 1.5,
            py: 0.5,
            borderRadius: '12px',
            bgcolor: surfaceContainer(theme, 'high'),
            color: 'primary.main',
            alignSelf: 'flex-start'
          }}
        >
          {t('settings.checkTimeoutValue', { value: displayedTimeout })}
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
      </ContentSection>

      <ContentSection
        icon={<ReorderOutlinedIcon fontSize="small" />}
        title={t('settings.checkAllMode')}
        description={t('settings.checkAllModeHint')}
      >
        <ToggleButtonGroup
          value={settings.checkAllMode}
          exclusive
          onChange={(event, value) => void handleCheckAllModeChange(event, value)}
          fullWidth
          sx={{
            '& .MuiToggleButton-root': {
              py: 1.35,
              gap: 0.75
            }
          }}
        >
          <ToggleButton value="sequential">
            <ReorderOutlinedIcon fontSize="small" />
            {t('settings.checkAllModeSequential')}
          </ToggleButton>
          <ToggleButton value="parallel">
            <PlaylistPlayIcon fontSize="small" />
            {t('settings.checkAllModeParallel')}
          </ToggleButton>
        </ToggleButtonGroup>

        {settings.checkAllMode === 'parallel' && (
          <Box sx={{ mt: 2.5 }}>
            <Stack
              direction="row"
              spacing={1}
              sx={{ mb: 1.25, alignItems: 'center', justifyContent: 'space-between' }}
            >
              <Typography variant="subtitle2">{t('settings.checkAllConcurrency')}</Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: '12px',
                  bgcolor: surfaceContainer(theme, 'high'),
                  color: 'primary.main'
                }}
              >
                {t('settings.checkAllConcurrencyValue', { value: displayedConcurrency })}
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('settings.checkAllConcurrencyHint')}
            </Typography>
            <Slider
              value={displayedConcurrency}
              onChange={handleConcurrencyChange}
              onChangeCommitted={() => void handleConcurrencyCommit()}
              min={CHECK_ALL_CONCURRENCY_MIN}
              max={CHECK_ALL_CONCURRENCY_MAX}
              step={1}
              marks={CONCURRENCY_MARKS}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => t('settings.checkAllConcurrencyValue', { value })}
              sx={{ px: 0.5 }}
            />
          </Box>
        )}
      </ContentSection>

      <ContentSection
        icon={<PlaylistPlayIcon fontSize="small" />}
        title={t('settings.domainCheckConcurrency')}
        description={t('settings.domainCheckConcurrencyHint')}
      >
        <Typography
          variant="body2"
          sx={{
            fontWeight: 700,
            fontFamily: 'monospace',
            px: 1.5,
            py: 0.5,
            borderRadius: '12px',
            bgcolor: surfaceContainer(theme, 'high'),
            color: 'primary.main',
            alignSelf: 'flex-start'
          }}
        >
          {t('settings.domainCheckConcurrencyValue', { value: displayedDomainConcurrency })}
        </Typography>
        <Slider
          value={displayedDomainConcurrency}
          onChange={handleDomainConcurrencyChange}
          onChangeCommitted={() => void handleDomainConcurrencyCommit()}
          min={DOMAIN_CHECK_CONCURRENCY_MIN}
          max={DOMAIN_CHECK_CONCURRENCY_MAX}
          step={1}
          marks={DOMAIN_CONCURRENCY_MARKS}
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => t('settings.domainCheckConcurrencyValue', { value })}
          sx={{ px: 0.5 }}
        />
      </ContentSection>

      <ContentSection
        icon={<PublicOutlinedIcon fontSize="small" />}
        title={t('settings.fetchExternalIp')}
        description={t('settings.fetchExternalIpHint')}
      >
        <Switch
          checked={settings.fetchExternalIp}
          onChange={(event) => void handleFetchExternalIpChange(event.target.checked)}
        />
      </ContentSection>

      <ContentSection
        icon={<DnsOutlinedIcon fontSize="small" />}
        title={t('settings.checkDomains')}
        description={t('settings.checkDomainsHint')}
      >
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
            settings.checkDomains.map((entry) => (
              <Box
                key={entry.domain}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.5,
                  py: 1.1,
                  borderRadius: '12px',
                  bgcolor: surfaceContainer(theme, 'low'),
                  opacity: entry.enabled ? 1 : 0.62,
                  transition: `background-color ${MD3_DURATION.short4}ms ${MD3_EASING.standard}, transform ${MD3_DURATION.short3}ms ${MD3_EASING.standard}, opacity ${MD3_DURATION.short4}ms ${MD3_EASING.standard}`,
                  '&:hover': {
                    bgcolor: surfaceContainer(theme, 'default'),
                    transform: 'translateX(2px)'
                  }
                }}
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={entry.enabled}
                      onChange={(event) =>
                        void handleToggleDomain(entry.domain, event.target.checked)
                      }
                      size="small"
                    />
                  }
                  label=""
                  aria-label={
                    entry.enabled
                      ? t('settings.disableDomain', { domain: entry.domain })
                      : t('settings.enableDomain', { domain: entry.domain })
                  }
                  sx={{ m: 0, flexShrink: 0 }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    flex: 1,
                    fontFamily: 'monospace',
                    fontWeight: 500,
                    wordBreak: 'break-all',
                    color: entry.enabled ? 'text.primary' : 'text.secondary'
                  }}
                >
                  {entry.domain}
                </Typography>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => void handleRemoveDomain(entry.domain)}
                  aria-label={t('common.delete')}
                >
                  <DeleteOutlinedIcon fontSize="small" />
                </IconButton>
              </Box>
            ))
          )}
        </Stack>

        {settings.checkDomains.length > 0 &&
          getEnabledCheckDomains(settings.checkDomains).length === 0 && (
            <Typography variant="body2" color="warning.main" sx={{ mt: 1.5 }}>
              {t('settings.checkDomainsAllDisabled')}
            </Typography>
          )}
      </ContentSection>
    </SettingsCardList>
  )
}

export default CheckingPage
