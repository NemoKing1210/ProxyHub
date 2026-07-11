import AddIcon from '@mui/icons-material/Add'
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined'
import NetworkCheckOutlinedIcon from '@mui/icons-material/NetworkCheckOutlined'
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined'
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay'
import ReorderOutlinedIcon from '@mui/icons-material/ReorderOutlined'
import SettingsBrightnessOutlinedIcon from '@mui/icons-material/SettingsBrightnessOutlined'
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined'
import ViewAgendaOutlinedIcon from '@mui/icons-material/ViewAgendaOutlined'
import ViewCompactOutlinedIcon from '@mui/icons-material/ViewCompactOutlined'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  IconButton,
  MenuItem,
  Slider,
  Snackbar,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AppInfo } from '../../../shared/types/app'
import {
  CHECK_ALL_CONCURRENCY_MAX,
  CHECK_ALL_CONCURRENCY_MIN,
  CHECK_TIMEOUT_MAX_MS,
  CHECK_TIMEOUT_MIN_MS,
  DOMAIN_CHECK_CONCURRENCY_MAX,
  DOMAIN_CHECK_CONCURRENCY_MIN,
  SUPPORTED_LANGUAGES,
  type AppLanguage,
  type AutoCheckScope,
  type CheckAllMode,
  type ProxyCardViewMode,
  type ThemeMode,
  getEnabledCheckDomains
} from '../../../shared/types/settings'
import ContentSection from '../components/ContentSection'
import ChangelogView from '../components/ChangelogView'
import LanguageFlag from '../components/LanguageFlag'
import SettingsAutoCheckSection from '../components/SettingsAutoCheckSection'
import SettingsBackupSection from '../components/SettingsBackupSection'
import SettingsSyncSection from '../components/SettingsSyncSection'
import SettingsDangerSection from '../components/SettingsDangerSection'
import SettingsSystemSection from '../components/SettingsSystemSection'
import { notifySyncDataChange, suppressSyncOnChange } from '../utils/sync-on-change'
import { useGroupStore } from '../store/groupStore'
import { useProxyStore } from '../store/proxyStore'
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
  return Math.min(
    CHECK_ALL_CONCURRENCY_MAX,
    Math.max(CHECK_ALL_CONCURRENCY_MIN, Math.round(value))
  )
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

function SettingsPage(): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const { settings, setTheme, setLanguage, setCheckDomains, setCheckTimeoutMs, updateSettings, resetSettings } =
    useSettingsStore()
  const groups = useGroupStore((state) => state.groups)
  const proxies = useProxyStore((state) => state.proxies)
  const isCheckingAll = useProxyStore((state) => state.isCheckingAll)
  const isChecking = useProxyStore((state) => state.checkingIds.size > 0)
  const setDetailsProxyId = useProxyStore((state) => state.setDetailsProxyId)
  const loadGroups = useGroupStore((state) => state.loadGroups)
  const loadSettings = useSettingsStore((state) => state.loadSettings)
  const favoriteCount = useProxyStore(
    (state) => state.proxies.filter((proxy) => proxy.isFavorite).length
  )
  const [domainInput, setDomainInput] = useState('')
  const [domainError, setDomainError] = useState<string | null>(null)
  const [savedOpen, setSavedOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [feedbackSeverity, setFeedbackSeverity] = useState<'success' | 'error'>('success')
  const [timeoutDraft, setTimeoutDraft] = useState(settings.checkTimeoutMs / 1000)
  const [isDraggingTimeout, setIsDraggingTimeout] = useState(false)
  const [concurrencyDraft, setConcurrencyDraft] = useState(settings.checkAllConcurrency)
  const [isDraggingConcurrency, setIsDraggingConcurrency] = useState(false)
  const [domainConcurrencyDraft, setDomainConcurrencyDraft] = useState(settings.domainCheckConcurrency)
  const [isDraggingDomainConcurrency, setIsDraggingDomainConcurrency] = useState(false)
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null)
  const [appInfoError, setAppInfoError] = useState(false)
  const [isAppInfoLoading, setIsAppInfoLoading] = useState(true)

  useEffect(() => {
    void loadGroups()
  }, [loadGroups])

  useEffect(() => {
    let isMounted = true

    const loadAppInfo = async (): Promise<void> => {
      setIsAppInfoLoading(true)
      setAppInfoError(false)

      try {
        const info = await window.api.getAppInfo()
        if (isMounted) {
          setAppInfo(info)
        }
      } catch {
        if (isMounted) {
          setAppInfoError(true)
        }
      } finally {
        if (isMounted) {
          setIsAppInfoLoading(false)
        }
      }
    }

    void loadAppInfo()

    return () => {
      isMounted = false
    }
  }, [])

  const timeoutSeconds = settings.checkTimeoutMs / 1000
  const displayedTimeout = isDraggingTimeout ? timeoutDraft : timeoutSeconds
  const displayedConcurrency = isDraggingConcurrency ? concurrencyDraft : settings.checkAllConcurrency
  const displayedDomainConcurrency = isDraggingDomainConcurrency
    ? domainConcurrencyDraft
    : settings.domainCheckConcurrency

  const notifySaved = (): void => {
    setSavedOpen(true)
  }

  const notifyFeedback = (message: string, severity: 'success' | 'error' = 'success'): void => {
    setFeedbackMessage(message)
    setFeedbackSeverity(severity)
    setFeedbackOpen(true)
  }

  const handleReloadBackupData = async (): Promise<void> => {
    suppressSyncOnChange()

    const [proxies, groups] = await Promise.all([
      window.api.getProxies(),
      window.api.getGroups()
    ])

    useProxyStore.setState({ proxies })
    useGroupStore.setState({ groups })
    await loadSettings()
  }

  const handleThemeChange = async (
    _event: React.MouseEvent<HTMLElement>,
    theme: ThemeMode | null
  ): Promise<void> => {
    if (!theme) return
    await setTheme(theme)
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
      settings.checkDomains.map((item) =>
        item.domain === domain ? { ...item, enabled } : item
      )
    )
    notifySaved()
  }

  const handleTrayEnabledChange = async (enabled: boolean): Promise<void> => {
    await updateSettings({
      trayEnabled: enabled,
      startMinimized: enabled ? settings.startMinimized : false
    })
    notifySaved()
  }

  const handleBackgroundCheckNotificationsChange = async (enabled: boolean): Promise<void> => {
    await updateSettings({ backgroundCheckNotifications: enabled })
    notifySaved()
  }

  const handleStartMinimizedChange = async (enabled: boolean): Promise<void> => {
    await updateSettings({ startMinimized: enabled })
    notifySaved()
  }

  const handleAutoCheckEnabledChange = async (enabled: boolean): Promise<void> => {
    await updateSettings({ autoCheckEnabled: enabled })
    notifySaved()
  }

  const handleAutoCheckIntervalChange = async (minutes: number): Promise<void> => {
    await updateSettings({ autoCheckIntervalMinutes: minutes })
    notifySaved()
  }

  const handleAutoCheckNotificationsChange = async (enabled: boolean): Promise<void> => {
    await updateSettings({ autoCheckNotifications: enabled })
    notifySaved()
  }

  const handleAutoCheckScopeChange = async (scope: AutoCheckScope): Promise<void> => {
    await updateSettings({
      autoCheckScope: scope,
      autoCheckGroupIds: scope === 'groups' ? settings.autoCheckGroupIds : []
    })
    notifySaved()
  }

  const handleAutoCheckGroupIdsChange = async (groupIds: string[]): Promise<void> => {
    await updateSettings({ autoCheckGroupIds: groupIds })
    notifySaved()
  }

  const handleDeleteAllProxiesAndGroups = async (): Promise<void> => {
    await Promise.all([window.api.saveProxies([]), window.api.saveGroups([])])
    notifySyncDataChange('proxies')

    useProxyStore.setState({
      proxies: [],
      checkingIds: new Set(),
      isCheckingAll: false,
      isAutoChecking: false
    })
    setDetailsProxyId(null)
    useGroupStore.setState({ groups: [] })

    notifyFeedback(t('settings.dangerZone.deleteAllSuccess'))
  }

  const handleResetSettings = async (): Promise<void> => {
    await resetSettings()

    const nextSettings = useSettingsStore.getState().settings
    setTimeoutDraft(nextSettings.checkTimeoutMs / 1000)
    setConcurrencyDraft(nextSettings.checkAllConcurrency)
    setDomainConcurrencyDraft(nextSettings.domainCheckConcurrency)
    setDomainInput('')
    setDomainError(null)

    notifyFeedback(t('settings.dangerZone.resetSettingsSuccess'))
  }

  const isDangerActionsDisabled = isCheckingAll || isChecking

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
          collapsible
          defaultExpanded
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

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1.25 }}>
                {t('settings.proxyCardView')}
              </Typography>
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
            </Box>

            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.proxyDragEnabled}
                    onChange={(event) => void handleProxyDragEnabledChange(event.target.checked)}
                  />
                }
                label={t('settings.proxyDragEnabled')}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, ml: 4.5 }}>
                {t('settings.proxyDragEnabledHint')}
              </Typography>
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

        <SettingsSystemSection
          trayEnabled={settings.trayEnabled}
          startMinimized={settings.startMinimized}
          backgroundCheckNotifications={settings.backgroundCheckNotifications}
          onTrayEnabledChange={(enabled) => void handleTrayEnabledChange(enabled)}
          onStartMinimizedChange={(enabled) => void handleStartMinimizedChange(enabled)}
          onBackgroundCheckNotificationsChange={(enabled) =>
            void handleBackgroundCheckNotificationsChange(enabled)
          }
        />

        <SettingsAutoCheckSection
          enabled={settings.autoCheckEnabled}
          intervalMinutes={settings.autoCheckIntervalMinutes}
          notifications={settings.autoCheckNotifications}
          scope={settings.autoCheckScope}
          groupIds={settings.autoCheckGroupIds}
          groups={groups}
          favoriteCount={favoriteCount}
          onEnabledChange={(enabled) => void handleAutoCheckEnabledChange(enabled)}
          onIntervalChange={(minutes) => void handleAutoCheckIntervalChange(minutes)}
          onNotificationsChange={(enabled) => void handleAutoCheckNotificationsChange(enabled)}
          onScopeChange={(scope) => void handleAutoCheckScopeChange(scope)}
          onGroupIdsChange={(groupIds) => void handleAutoCheckGroupIdsChange(groupIds)}
        />

        <ContentSection
          icon={<NetworkCheckOutlinedIcon fontSize="small" />}
          title={t('settings.sections.checking')}
          description={t('settings.sections.checkingDescription')}
          collapsible
          defaultExpanded={false}
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
                {t('settings.checkAllMode')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                {t('settings.checkAllModeHint')}
              </Typography>
              <ToggleButtonGroup
                value={settings.checkAllMode}
                exclusive
                onChange={(event, value) => void handleCheckAllModeChange(event, value)}
                fullWidth
                sx={{
                  mb: settings.checkAllMode === 'parallel' ? 2.5 : 0,
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
                <Box>
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
                        borderRadius: 2,
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
                    valueLabelFormat={(value) =>
                      t('settings.checkAllConcurrencyValue', { value })
                    }
                    sx={{ px: 0.5 }}
                  />
                </Box>
              )}
            </Box>

            <Box>
              <Stack
                direction="row"
                spacing={1}
                sx={{ mb: 1.25, alignItems: 'center', justifyContent: 'space-between' }}
              >
                <Typography variant="subtitle2">{t('settings.domainCheckConcurrency')}</Typography>
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
                  {t('settings.domainCheckConcurrencyValue', {
                    value: displayedDomainConcurrency
                  })}
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t('settings.domainCheckConcurrencyHint')}
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
                valueLabelFormat={(value) =>
                  t('settings.domainCheckConcurrencyValue', { value })
                }
                sx={{ px: 0.5 }}
              />
            </Box>

            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.fetchExternalIp}
                    onChange={(event) => void handleFetchExternalIpChange(event.target.checked)}
                  />
                }
                label={t('settings.fetchExternalIp')}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, ml: 4.5 }}>
                {t('settings.fetchExternalIpHint')}
              </Typography>
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
                  settings.checkDomains.map((entry) => (
                    <Box
                      key={entry.domain}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        px: 1.5,
                        py: 1.1,
                        borderRadius: 2,
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
            </Box>
          </Stack>
        </ContentSection>

        <SettingsBackupSection
          proxies={proxies}
          groups={groups}
          onExportSuccess={() => notifyFeedback(t('settings.backup.exportSuccess'))}
          onListExportSuccess={(format) => notifyFeedback(t(`settings.backup.${format}.exportSuccess`))}
          onImportSuccess={({ proxiesAdded, groupsAdded, settingsImported }) =>
            notifyFeedback(
              t('settings.backup.importSuccess', {
                proxies: proxiesAdded,
                groups: groupsAdded,
                settings: settingsImported ? t('settings.backup.importSuccessSettings') : ''
              })
            )
          }
          onListImportSuccess={({ format, proxiesAdded, skippedDuplicates }) =>
            notifyFeedback(
              t(`settings.backup.${format}.importSuccess`, {
                proxies: proxiesAdded,
                skipped:
                  skippedDuplicates > 0
                    ? t(`settings.backup.${format}.importSuccessSkipped`, { skipped: skippedDuplicates })
                    : ''
              })
            )
          }
          onError={(message) => notifyFeedback(message, 'error')}
          onReloadData={handleReloadBackupData}
        />

        <SettingsSyncSection
          onSaved={notifySaved}
          onFeedback={notifyFeedback}
          onReloadData={handleReloadBackupData}
        />

        <SettingsDangerSection
          proxyCount={proxies.length}
          groupCount={groups.length}
          disabled={isDangerActionsDisabled}
          onDeleteAll={handleDeleteAllProxiesAndGroups}
          onResetSettings={handleResetSettings}
        />

        <ContentSection
          icon={<InfoOutlinedIcon fontSize="small" />}
          title={t('settings.sections.about')}
          description={t('settings.sections.aboutDescription')}
          collapsible
          defaultExpanded={false}
        >
          {isAppInfoLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : appInfoError ? (
            <Alert severity="error" variant="outlined">
              {t('settings.changelogLoadError')}
            </Alert>
          ) : appInfo ? (
            <ChangelogView
              version={appInfo.version}
              entries={appInfo.changelog}
              author={appInfo.author}
              authorEmail={appInfo.authorEmail}
              repositoryUrl={appInfo.repositoryUrl}
            />
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              {t('settings.changelogEmpty')}
            </Typography>
          )}
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

      <Snackbar
        open={feedbackOpen}
        autoHideDuration={4000}
        onClose={() => setFeedbackOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={feedbackSeverity}
          variant="filled"
          onClose={() => setFeedbackOpen(false)}
        >
          {feedbackMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default SettingsPage
