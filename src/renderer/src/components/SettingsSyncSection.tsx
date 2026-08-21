import CloudSyncOutlinedIcon from '@mui/icons-material/CloudSyncOutlined'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined'
import GoogleIcon from '@mui/icons-material/Google'
import HubOutlinedIcon from '@mui/icons-material/HubOutlined'
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
  InputAdornment,
  MenuItem,
  Slider,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GITHUB_CREATE_TOKEN_URL } from '../../../shared/constants/sync'
import { SYNC_INTERVAL_MAX, SYNC_INTERVAL_MIN } from '../../../shared/constants/sync'
import type { BackupImportMode, BackupPreview } from '../../../shared/types/backup'
import type {
  SyncConfig,
  SyncProviderType,
  SyncPublicState,
  SyncScope
} from '../../../shared/types/sync'
import { DEFAULT_SYNC_CONFIG, resolveSyncRemoteId } from '../../../shared/utils/sync-config'
import { resolveLastSyncAt } from '../../../shared/utils/sync-status'
import { formatDateTime } from '../../../shared/utils/datetime'
import BackupPasswordFields, { validateBackupExportPassword } from './BackupPasswordFields'
import ContentSection from './ContentSection'
import ProxyFormSection from './ProxyFormSection'
import SettingsSwitchCard from './SettingsSwitchCard'
import SyncStatusSection from './SyncStatusSection'
import SyncPullPreviewDialog from './SyncPullPreviewDialog'
import { surfaceContainer, withThemeAlpha } from '../theme'
import { pushSyncWithActivity } from '../utils/sync-push'
import { BACKUP_MIN_PASSWORD_LENGTH } from '../../../shared/constants/backup-crypto'

interface SettingsSyncSectionProps {
  onSaved: () => void
  onFeedback: (message: string, severity?: 'success' | 'error') => void
  onReloadData: () => Promise<void>
}

const INTERVAL_MARKS = [
  { value: 5, label: '5' },
  { value: 15, label: '15' },
  { value: 30, label: '30' },
  { value: 60, label: '60' },
  { value: 120, label: '120' },
  { value: 360, label: '360' }
]

const PROVIDER_OPTIONS: SyncProviderType[] = ['none', 'github-gist', 'google-drive']

function clampIntervalMinutes(value: number): number {
  return Math.min(SYNC_INTERVAL_MAX, Math.max(SYNC_INTERVAL_MIN, Math.round(value)))
}

function resolveSyncError(
  t: (key: string, options?: Record<string, unknown>) => string,
  error: { code: string; message: string }
): string {
  const messageKey = `settings.sync.errors.${error.code}`
  const localized = t(messageKey, { defaultValue: '' })

  if (localized) {
    return localized
  }

  if (error.message.trim()) {
    return error.message
  }

  return t('settings.sync.genericError', {
    message: error.message
  })
}

function SettingsSyncSection({
  onSaved,
  onFeedback,
  onReloadData
}: SettingsSyncSectionProps): React.JSX.Element {
  const { t, i18n } = useTranslation()
  const theme = useTheme()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [isPushing, setIsPushing] = useState(false)
  const [isPulling, setIsPulling] = useState(false)

  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false)
  const [isDisconnectingGoogle, setIsDisconnectingGoogle] = useState(false)

  const [hasGoogleClientId, setHasGoogleClientId] = useState(false)

  const [config, setConfig] = useState<SyncConfig>(DEFAULT_SYNC_CONFIG)
  const [hasCredentials, setHasCredentials] = useState(false)
  const [googleEmail, setGoogleEmail] = useState<string | undefined>()
  const [hasPayloadPassword, setHasPayloadPassword] = useState(false)
  const [safeStorageAvailable, setSafeStorageAvailable] = useState(true)
  const [status, setStatus] = useState<SyncPublicState['status']>({})

  const [githubTokenDraft, setGithubTokenDraft] = useState('')
  const [remoteIdDraft, setRemoteIdDraft] = useState('')
  const [encryptPayload, setEncryptPayload] = useState(false)
  const [payloadPassword, setPayloadPassword] = useState('')
  const [payloadPasswordConfirm, setPayloadPasswordConfirm] = useState('')

  const [intervalDraft, setIntervalDraft] = useState(DEFAULT_SYNC_CONFIG.autoSyncIntervalMinutes)
  const [isDraggingInterval, setIsDraggingInterval] = useState(false)

  const [previewOpen, setPreviewOpen] = useState(false)
  const [preview, setPreview] = useState<BackupPreview | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [importPassword, setImportPassword] = useState('')

  const resetUnavailableGoogleProviderRef = useRef(false)

  const isProviderEnabled = config.provider !== 'none'
  const isBusy = isSaving || isTesting || isPushing || isPulling

  const applyPublicState = useCallback((state: SyncPublicState): void => {
    setConfig(state.config)
    setStatus(state.status)
    setHasCredentials(state.hasCredentials)
    setGoogleEmail(state.googleEmail)
    setHasGoogleClientId(state.hasGoogleClientId)
    setHasPayloadPassword(state.hasPayloadPassword)
    setSafeStorageAvailable(state.safeStorageAvailable)
    setRemoteIdDraft(resolveSyncRemoteId(state.config) ?? '')
    setEncryptPayload(state.config.encryptPayload)
    setIntervalDraft(state.config.autoSyncIntervalMinutes)
  }, [])

  const loadSyncState = useCallback(async (): Promise<void> => {
    const state = await window.api.getSyncConfig()
    applyPublicState(state)
  }, [applyPublicState])

  useEffect(() => {
    void (async () => {
      try {
        await loadSyncState()
      } finally {
        setIsLoading(false)
      }
    })()
  }, [loadSyncState])

  const saveConfig = async (
    nextConfig: SyncConfig,
    secrets?: {
      githubToken?: string
      payloadPassword?: string
      clearGithubToken?: boolean
      clearPayloadPassword?: boolean
    }
  ): Promise<boolean> => {
    if (nextConfig.encryptPayload && (secrets?.payloadPassword || !hasPayloadPassword)) {
      const passwordError = validateBackupExportPassword(
        true,
        secrets?.payloadPassword ?? payloadPassword,
        secrets?.payloadPassword ?? payloadPasswordConfirm
      )

      if (passwordError === 'too_short') {
        onFeedback(
          t('settings.backup.passwordTooShort', { min: BACKUP_MIN_PASSWORD_LENGTH }),
          'error'
        )
        return false
      }

      if (passwordError === 'mismatch') {
        onFeedback(t('settings.backup.passwordMismatch'), 'error')
        return false
      }
    }

    setIsSaving(true)

    try {
      const state = await window.api.saveSyncConfig({
        config: nextConfig,
        githubToken: secrets?.githubToken,
        payloadPassword: secrets?.payloadPassword,
        clearGithubToken: secrets?.clearGithubToken,
        clearPayloadPassword: secrets?.clearPayloadPassword
      })

      applyPublicState(state)
      setGithubTokenDraft('')
      if (secrets?.payloadPassword) {
        setPayloadPassword('')
        setPayloadPasswordConfirm('')
      }
      onSaved()
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : t('settings.sync.errors.unknown')
      onFeedback(message, 'error')
      return false
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    if (isLoading || hasGoogleClientId || config.provider !== 'google-drive') {
      return
    }

    if (resetUnavailableGoogleProviderRef.current) {
      return
    }

    resetUnavailableGoogleProviderRef.current = true

    void saveConfig({
      ...config,
      provider: 'none',
      remoteId: undefined,
      gistId: undefined,
      autoSyncEnabled: false,
      syncOnStartup: false,
      pushOnChange: false,
      encryptPayload: false
    })
  }, [isLoading, hasGoogleClientId, config])

  const handleProviderChange = async (provider: SyncProviderType): Promise<void> => {
    if (provider === 'google-drive' && !hasGoogleClientId) {
      return
    }

    const nextConfig: SyncConfig = {
      ...config,
      provider,
      remoteId: provider === config.provider ? resolveSyncRemoteId(config) : undefined,
      gistId: provider === 'github-gist' ? resolveSyncRemoteId(config) : undefined,
      autoSyncEnabled: provider === 'none' ? false : config.autoSyncEnabled,
      syncOnStartup: provider === 'none' ? false : config.syncOnStartup,
      pushOnChange: provider === 'none' ? false : config.pushOnChange,
      encryptPayload: provider === 'none' ? false : config.encryptPayload
    }

    await saveConfig(nextConfig)
  }

  const handleScopeChange = async (scope: SyncScope): Promise<void> => {
    await saveConfig({ ...config, scope })
  }

  const handlePullModeChange = async (pullMode: BackupImportMode): Promise<void> => {
    await saveConfig({ ...config, pullMode })
  }

  const handleSaveProviderSettings = async (): Promise<void> => {
    const nextConfig: SyncConfig = {
      ...config,
      remoteId:
        config.provider === 'github-gist' ? remoteIdDraft.trim() || undefined : config.remoteId,
      gistId: config.provider === 'github-gist' ? remoteIdDraft.trim() || undefined : undefined,
      encryptPayload
    }

    const secrets: {
      githubToken?: string
      payloadPassword?: string
    } = {}

    if (githubTokenDraft.trim()) {
      secrets.githubToken = githubTokenDraft.trim()
    }

    if (encryptPayload && payloadPassword) {
      secrets.payloadPassword = payloadPassword
    }

    await saveConfig(nextConfig, secrets)
  }

  const handleAutoSyncChange = async (enabled: boolean): Promise<void> => {
    await saveConfig({ ...config, autoSyncEnabled: enabled })
  }

  const handleSyncOnStartupChange = async (enabled: boolean): Promise<void> => {
    await saveConfig({ ...config, syncOnStartup: enabled })
  }

  const handlePushOnChangeChange = async (enabled: boolean): Promise<void> => {
    await saveConfig({ ...config, pushOnChange: enabled })
  }

  const handleIntervalCommit = async (): Promise<void> => {
    setIsDraggingInterval(false)
    const nextInterval = clampIntervalMinutes(intervalDraft)

    if (nextInterval === config.autoSyncIntervalMinutes) {
      return
    }

    await saveConfig({ ...config, autoSyncIntervalMinutes: nextInterval })
  }

  const handleConnectGoogle = async (): Promise<void> => {
    setIsConnectingGoogle(true)

    try {
      if (!hasGoogleClientId) {
        onFeedback(t('settings.sync.errors.google_oauth_not_configured'), 'error')
        return
      }

      const result = await window.api.connectGoogleDrive()

      if (!result.ok || result.error) {
        onFeedback(resolveSyncError(t, result.error ?? { code: 'unknown', message: '' }), 'error')
        return
      }

      await loadSyncState()
      onFeedback(
        result.email
          ? t('settings.sync.googleConnectSuccess', { email: result.email })
          : t('settings.sync.googleConnectSuccessGeneric')
      )
    } catch {
      onFeedback(t('settings.sync.errors.unknown'), 'error')
    } finally {
      setIsConnectingGoogle(false)
    }
  }

  const handleDisconnectGoogle = async (): Promise<void> => {
    setIsDisconnectingGoogle(true)

    try {
      const result = await window.api.disconnectGoogleDrive()

      if (!result.ok || result.error) {
        onFeedback(resolveSyncError(t, result.error ?? { code: 'unknown', message: '' }), 'error')
        return
      }

      await loadSyncState()
      onFeedback(t('settings.sync.googleDisconnectSuccess'))
    } catch {
      onFeedback(t('settings.sync.errors.unknown'), 'error')
    } finally {
      setIsDisconnectingGoogle(false)
    }
  }

  const handleTestConnection = async (): Promise<void> => {
    setIsTesting(true)

    try {
      const result = await window.api.testSyncConnection(githubTokenDraft.trim() || undefined)

      if (!result.ok || result.error) {
        onFeedback(resolveSyncError(t, result.error ?? { code: 'unknown', message: '' }), 'error')
        return
      }

      onFeedback(t('settings.sync.testSuccess'))
    } catch {
      onFeedback(t('settings.sync.errors.unknown'), 'error')
    } finally {
      setIsTesting(false)
    }
  }

  const handlePush = async (): Promise<void> => {
    setIsPushing(true)

    try {
      const result = await pushSyncWithActivity()

      if (!result.ok || result.error) {
        onFeedback(resolveSyncError(t, result.error ?? { code: 'unknown', message: '' }), 'error')
        await loadSyncState()
        return
      }

      if (result.remoteId && result.remoteId !== resolveSyncRemoteId(config)) {
        setRemoteIdDraft(result.remoteId)
      }

      await loadSyncState()
      onFeedback(t('settings.sync.pushSuccess'))
    } catch {
      onFeedback(t('settings.sync.errors.unknown'), 'error')
    } finally {
      setIsPushing(false)
    }
  }

  const handlePull = async (): Promise<void> => {
    setIsPulling(true)

    try {
      const result = await window.api.pullSyncPreview()

      if (!result.ok || result.error) {
        onFeedback(resolveSyncError(t, result.error ?? { code: 'unknown', message: '' }), 'error')
        await loadSyncState()
        return
      }

      setPreview(result.preview)
      setSessionId(result.sessionId)
      setImportPassword('')
      setPreviewOpen(true)
      await loadSyncState()
    } catch {
      onFeedback(t('settings.sync.errors.unknown'), 'error')
    } finally {
      setIsPulling(false)
    }
  }

  const handleConfirmPull = async (
    mode: BackupImportMode,
    proxyIds?: string[],
    password?: string
  ): Promise<void> => {
    if (!sessionId) {
      return
    }

    const result = await window.api.applySyncPull({
      sessionId,
      mode,
      proxyIds,
      password
    })

    if (!result.ok || result.error) {
      onFeedback(resolveSyncError(t, result.error ?? { code: 'unknown', message: '' }), 'error')
      return
    }

    await onReloadData()
    await loadSyncState()
    onFeedback(
      t('settings.sync.pullSuccess', {
        proxies: result.result.proxiesAdded,
        groups: result.result.groupsAdded,
        settings: result.result.settingsImported ? t('settings.backup.importSuccessSettings') : ''
      })
    )
  }

  const formatIntervalLabel = (minutes: number): string => {
    if (minutes >= 60 && minutes % 60 === 0) {
      return t('settings.autoCheckIntervalHours', { value: minutes / 60 })
    }

    return t('settings.autoCheckIntervalMinutes', { value: minutes })
  }

  const displayedInterval = isDraggingInterval ? intervalDraft : config.autoSyncIntervalMinutes
  const isGithubProvider = config.provider === 'github-gist'
  const isGoogleProvider = config.provider === 'google-drive'
  const canPushGithub = isGithubProvider && (hasCredentials || githubTokenDraft.trim().length > 0)
  const canPushGoogle = isGoogleProvider && hasCredentials && hasGoogleClientId
  const canPush = isProviderEnabled && (canPushGithub || canPushGoogle)
  const canPullGithub =
    canPushGithub && Boolean(resolveSyncRemoteId(config) || remoteIdDraft.trim())
  const canPullGoogle = isGoogleProvider && hasCredentials && hasGoogleClientId
  const canPull = isProviderEnabled && (canPullGithub || canPullGoogle)

  const selectedProviderValue =
    config.provider === 'google-drive' && !hasGoogleClientId ? 'none' : config.provider

  const sectionTitle = useMemo(
    () => (
      <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
        <span>{t('settings.sections.sync')}</span>
        <Chip
          label={t(`settings.sync.providers.${config.provider}`)}
          size="small"
          sx={{
            fontWeight: 700,
            height: 24,
            bgcolor: withThemeAlpha(
              theme,
              config.provider === 'none' ? theme.palette.text.secondary : theme.palette.info.main,
              config.provider === 'none' ? 0.1 : 0.14
            ),
            color: config.provider === 'none' ? 'text.secondary' : 'info.main',
            pointerEvents: 'none',
            '& .MuiChip-label': { px: 1.1 }
          }}
        />
      </Stack>
    ),
    [config.provider, t, theme]
  )

  const sectionDescription = useMemo(() => {
    if (config.provider === 'none') {
      return t('settings.sections.syncDescription')
    }

    const lastSyncAt = resolveLastSyncAt(status)

    if (lastSyncAt) {
      return t('settings.sync.headerDate', {
        date: formatDateTime(lastSyncAt, i18n.language)
      })
    }

    return t('settings.sync.headerNever')
  }, [config.provider, status, t, i18n.language])

  if (isLoading) {
    return (
      <ContentSection
        icon={<CloudSyncOutlinedIcon fontSize="small" />}
        title={sectionTitle}
        description={sectionDescription}
        showHeader={false}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      </ContentSection>
    )
  }

  return (
    <>
      <ContentSection
        icon={<CloudSyncOutlinedIcon fontSize="small" />}
        title={sectionTitle}
        description={sectionDescription}
        showHeader={false}
      >
        <Stack spacing={3}>
          <ProxyFormSection
            icon={<HubOutlinedIcon fontSize="small" />}
            title={t('settings.sync.provider')}
            description={t(`settings.sync.providers.${config.provider}`)}
          >
            <TextField
              select
              fullWidth
              value={selectedProviderValue}
              disabled={isBusy}
              helperText={!hasGoogleClientId ? t('settings.sync.googleDriveSelectHint') : undefined}
              onChange={(event) =>
                void handleProviderChange(event.target.value as SyncProviderType)
              }
            >
              {PROVIDER_OPTIONS.map((provider) => {
                const isGoogleDriveOption = provider === 'google-drive'
                const isGoogleDriveUnavailable = isGoogleDriveOption && !hasGoogleClientId

                return (
                  <MenuItem
                    key={provider}
                    value={provider}
                    disabled={isGoogleDriveUnavailable}
                    sx={
                      isGoogleDriveUnavailable
                        ? {
                            opacity: 1,
                            '&.Mui-disabled': {
                              opacity: 1
                            }
                          }
                        : undefined
                    }
                  >
                    <Stack
                      direction="row"
                      spacing={1}
                      useFlexGap
                      sx={{ alignItems: 'center', width: '100%' }}
                    >
                      <Box component="span" sx={{ flex: 1 }}>
                        {t(`settings.sync.providers.${provider}`)}
                      </Box>
                      {isGoogleDriveUnavailable && (
                        <Chip
                          label={t('settings.sync.googleDriveNotConfiguredBadge')}
                          size="small"
                          variant="outlined"
                          sx={{
                            height: 22,
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            color: 'warning.main',
                            borderColor: withThemeAlpha(theme, theme.palette.warning.main, 0.45),
                            pointerEvents: 'none'
                          }}
                        />
                      )}
                    </Stack>
                  </MenuItem>
                )
              })}
            </TextField>

            <Collapse in={isProviderEnabled}>
              <Stack spacing={2.5}>
                {!safeStorageAvailable && (
                  <Alert severity="warning" variant="outlined" icon={<WarningAmberOutlinedIcon />}>
                    {t('settings.sync.safeStorageUnavailable')}
                  </Alert>
                )}

                <Alert severity="info" variant="outlined">
                  {isGoogleProvider
                    ? t('settings.sync.googleSecurityHint')
                    : t('settings.sync.securityHint')}
                </Alert>

                {isGithubProvider && (
                  <>
                    <Box>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2">
                          {t('settings.sync.githubToken')}
                        </Typography>
                        <IconButton
                          size="small"
                          aria-label={t('settings.sync.createToken')}
                          onClick={() => void window.api.openExternal(GITHUB_CREATE_TOKEN_URL)}
                        >
                          <LinkOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                      <TextField
                        fullWidth
                        type="password"
                        value={githubTokenDraft}
                        disabled={isBusy || !safeStorageAvailable}
                        placeholder={
                          hasCredentials
                            ? t('settings.sync.tokenSavedPlaceholder')
                            : t('settings.sync.githubTokenPlaceholder')
                        }
                        onChange={(event) => setGithubTokenDraft(event.target.value)}
                        slotProps={{
                          input: {
                            endAdornment: hasCredentials ? (
                              <InputAdornment position="end">
                                <Typography variant="caption" color="success.main">
                                  {t('settings.sync.tokenSaved')}
                                </Typography>
                              </InputAdornment>
                            ) : undefined
                          }
                        }}
                      />
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mt: 0.75, display: 'block' }}
                      >
                        {t('settings.sync.githubTokenHint')}
                      </Typography>
                    </Box>

                    <TextField
                      fullWidth
                      label={t('settings.sync.gistId')}
                      value={remoteIdDraft}
                      disabled={isBusy}
                      placeholder={t('settings.sync.gistIdPlaceholder')}
                      helperText={t('settings.sync.gistIdHint')}
                      onChange={(event) => setRemoteIdDraft(event.target.value)}
                    />
                  </>
                )}

                {isGoogleProvider && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      {t('settings.sync.googleAccount')}
                    </Typography>
                    {hasCredentials ? (
                      <Stack spacing={1.5}>
                        <Alert severity="success" variant="outlined">
                          {googleEmail
                            ? t('settings.sync.googleConnectedAs', { email: googleEmail })
                            : t('settings.sync.googleConnected')}
                        </Alert>
                        <Button
                          variant="outlined"
                          color="inherit"
                          disabled={isBusy || isDisconnectingGoogle}
                          onClick={() => void handleDisconnectGoogle()}
                          startIcon={
                            isDisconnectingGoogle ? (
                              <CircularProgress size={18} color="inherit" />
                            ) : (
                              <LogoutOutlinedIcon />
                            )
                          }
                        >
                          {t('settings.sync.googleDisconnect')}
                        </Button>
                      </Stack>
                    ) : (
                      <Stack spacing={1.25}>
                        <Typography variant="body2" color="text.secondary">
                          {t('settings.sync.googleConnectHint')}
                        </Typography>
                        <Button
                          variant="contained"
                          disabled={
                            isBusy ||
                            !safeStorageAvailable ||
                            isConnectingGoogle ||
                            !hasGoogleClientId
                          }
                          onClick={() => void handleConnectGoogle()}
                          startIcon={
                            isConnectingGoogle ? (
                              <CircularProgress size={18} color="inherit" />
                            ) : (
                              <GoogleIcon />
                            )
                          }
                        >
                          {t('settings.sync.googleConnect')}
                        </Button>
                      </Stack>
                    )}
                  </Box>
                )}

                <Typography variant="subtitle2">{t('settings.sync.scope')}</Typography>
                <ToggleButtonGroup
                  value={config.scope}
                  exclusive
                  fullWidth
                  disabled={isBusy}
                  onChange={(_event, value: SyncScope | null) => {
                    if (value) {
                      void handleScopeChange(value)
                    }
                  }}
                  sx={{
                    '& .MuiToggleButton-root': {
                      py: 1.1,
                      px: 1.25,
                      fontSize: '0.82rem'
                    }
                  }}
                >
                  <ToggleButton value="full">{t('settings.backup.exportKindFull')}</ToggleButton>
                  <ToggleButton value="proxies">
                    {t('settings.backup.exportKindProxies')}
                  </ToggleButton>
                  <ToggleButton value="settings">
                    {t('settings.backup.exportKindSettings')}
                  </ToggleButton>
                </ToggleButtonGroup>

                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                    {t('settings.sync.pullMode')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.25 }}>
                    {config.pullMode === 'replace'
                      ? t('settings.backup.importModeReplaceHint')
                      : t('settings.backup.importModeMergeHint')}
                  </Typography>
                  <ToggleButtonGroup
                    value={config.pullMode}
                    exclusive
                    fullWidth
                    disabled={isBusy}
                    onChange={(_event, value: BackupImportMode | null) => {
                      if (value) {
                        void handlePullModeChange(value)
                      }
                    }}
                  >
                    <ToggleButton value="merge">
                      {t('settings.backup.importModeMerge')}
                    </ToggleButton>
                    <ToggleButton value="replace">
                      {t('settings.backup.importModeReplace')}
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>

                <BackupPasswordFields
                  enabled={encryptPayload}
                  onEnabledChange={setEncryptPayload}
                  password={payloadPassword}
                  onPasswordChange={setPayloadPassword}
                  confirmPassword={payloadPasswordConfirm}
                  onConfirmPasswordChange={setPayloadPasswordConfirm}
                  disabled={isBusy || !safeStorageAvailable}
                />
                {hasPayloadPassword && encryptPayload && !payloadPassword && (
                  <Typography variant="caption" color="success.main">
                    {t('settings.sync.passwordSaved')}
                  </Typography>
                )}

                {(isGithubProvider || isGoogleProvider) && (
                  <Button
                    variant="outlined"
                    disabled={
                      isBusy ||
                      !safeStorageAvailable ||
                      (isGithubProvider && !hasCredentials && !githubTokenDraft.trim()) ||
                      (isGoogleProvider && !hasCredentials)
                    }
                    onClick={() => void handleSaveProviderSettings()}
                    startIcon={
                      isSaving ? <CircularProgress size={18} color="inherit" /> : undefined
                    }
                  >
                    {t('settings.sync.saveSettings')}
                  </Button>
                )}

                <Button
                  variant="text"
                  disabled={
                    isBusy ||
                    (isGithubProvider && !hasCredentials) ||
                    (isGoogleProvider && !hasCredentials)
                  }
                  onClick={() => void handleTestConnection()}
                  startIcon={
                    isTesting ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <PlayArrowOutlinedIcon />
                    )
                  }
                >
                  {t('settings.sync.testConnection')}
                </Button>
              </Stack>
            </Collapse>
          </ProxyFormSection>

          <Collapse in={isProviderEnabled} mountOnEnter unmountOnExit>
            <Box sx={{ borderRadius: '16px' }}>
              <SettingsSwitchCard
                icon={<CloudSyncOutlinedIcon fontSize="small" />}
                title={t('settings.sync.autoSyncEnabled')}
                hint={t('settings.sync.autoSyncEnabledHint')}
                checked={config.autoSyncEnabled}
                onChange={(enabled) => void handleAutoSyncChange(enabled)}
                disabled={isBusy}
                accent="info"
                clickable
              />

              <Collapse in={config.autoSyncEnabled} mountOnEnter unmountOnExit>
                <Box sx={{ px: 2.25, pb: 2.25 }}>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="subtitle2">
                      {t('settings.sync.autoSyncInterval')}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        px: 1,
                        py: 0.25,
                        borderRadius: '12px',
                        fontFamily: 'monospace',
                        bgcolor: surfaceContainer(theme, 'high')
                      }}
                    >
                      {formatIntervalLabel(displayedInterval)}
                    </Typography>
                  </Stack>
                  <Slider
                    value={displayedInterval}
                    min={SYNC_INTERVAL_MIN}
                    max={SYNC_INTERVAL_MAX}
                    step={1}
                    marks={INTERVAL_MARKS}
                    disabled={isBusy}
                    onChange={(_event, value) => {
                      setIsDraggingInterval(true)
                      setIntervalDraft(
                        clampIntervalMinutes(Array.isArray(value) ? value[0] : value)
                      )
                    }}
                    onChangeCommitted={() => void handleIntervalCommit()}
                  />
                </Box>
              </Collapse>

              <SettingsSwitchCard
                icon={<FileDownloadOutlinedIcon fontSize="small" />}
                title={t('settings.sync.syncOnStartup')}
                hint={t('settings.sync.syncOnStartupHint')}
                checked={config.syncOnStartup}
                onChange={(enabled) => void handleSyncOnStartupChange(enabled)}
                disabled={isBusy}
                accent="info"
                clickable
              />

              <SettingsSwitchCard
                icon={<FileUploadOutlinedIcon fontSize="small" />}
                title={t('settings.sync.pushOnChange')}
                hint={t('settings.sync.pushOnChangeHint')}
                checked={config.pushOnChange}
                onChange={(enabled) => void handlePushOnChangeChange(enabled)}
                disabled={isBusy}
                accent="info"
                clickable
              />
            </Box>
          </Collapse>

          {isProviderEnabled && (
            <SyncStatusSection
              config={config}
              status={status}
              hasCredentials={hasCredentials}
              googleEmail={googleEmail}
              hasPayloadPassword={hasPayloadPassword}
              safeStorageAvailable={safeStorageAvailable}
            />
          )}

          {isProviderEnabled && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
              <Button
                variant="contained"
                fullWidth
                disabled={isBusy || !canPush}
                onClick={() => void handlePush()}
                startIcon={
                  isPushing ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <FileUploadOutlinedIcon />
                  )
                }
              >
                {t('settings.sync.push')}
              </Button>
              <Button
                variant="outlined"
                fullWidth
                disabled={isBusy || !canPull}
                onClick={() => void handlePull()}
                startIcon={
                  isPulling ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <FileDownloadOutlinedIcon />
                  )
                }
              >
                {t('settings.sync.pull')}
              </Button>
            </Stack>
          )}
        </Stack>
      </ContentSection>

      <SyncPullPreviewDialog
        open={previewOpen}
        preview={preview}
        sessionId={sessionId}
        importPassword={importPassword}
        onImportPasswordChange={setImportPassword}
        onPreviewChange={setPreview}
        onClose={() => {
          setPreviewOpen(false)
          setPreview(null)
          setSessionId(null)
          setImportPassword('')
        }}
        onError={(message) => onFeedback(message, 'error')}
        onConfirm={handleConfirmPull}
      />
    </>
  )
}

export default SettingsSyncSection
