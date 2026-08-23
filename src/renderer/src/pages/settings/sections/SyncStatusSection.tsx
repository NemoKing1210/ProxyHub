import CheckIcon from '@mui/icons-material/Check'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined'
import { Alert, Box, Button, Chip, Divider, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { SyncConfig, SyncPublicState } from '@shared/types/sync'
import { resolveSyncRemoteId } from '@shared/utils/sync-config'
import { formatDateTime } from '@shared/utils/datetime'
import { buildSyncStatusErrorReport, resolveLastSyncAt } from '@shared/utils/sync-status'
import ProxyFormSection from '../../../components/proxy/ProxyFormSection'
import { getListCardPosition, getListCardRadius } from '../../../lib/card-list'
import { outlineVariant, surfaceContainer, surfaceTint, withThemeAlpha } from '../../../theme'

interface SyncStatusSectionProps {
  config: SyncConfig
  status: SyncPublicState['status']
  hasCredentials: boolean
  googleEmail?: string
  hasPayloadPassword: boolean
  safeStorageAvailable: boolean
  children?: React.ReactNode
  listRadius?: string
}

function StatusRow({
  label,
  value,
  valueColor,
  mono
}: {
  label: string
  value: React.ReactNode
  valueColor?: string
  mono?: boolean
}): React.JSX.Element {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 2,
        py: 1.1,
        minWidth: 0
      }}
    >
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ flexShrink: 0, maxWidth: { xs: '45%', sm: '42%' }, lineHeight: 1.4 }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          flex: 1,
          textAlign: 'right',
          fontWeight: mono ? 600 : 500,
          fontFamily: mono ? 'monospace' : undefined,
          fontSize: mono ? '0.8rem' : undefined,
          wordBreak: 'break-word',
          lineHeight: 1.4,
          color: valueColor
        }}
      >
        {value}
      </Typography>
    </Box>
  )
}

function StatusGroup({
  icon,
  title,
  children,
  listRadius
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
  listRadius?: string
}): React.JSX.Element {
  const theme = useTheme()
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: listRadius ?? '12px',
        bgcolor: surfaceContainer(theme, 'default'),
        border: `1px solid ${outlineVariant(theme)}`
      }}
    >
      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 1 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            bgcolor: surfaceTint(theme, 'primary', 0.12),
            color: 'primary.main'
          }}
        >
          {icon}
        </Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
      </Stack>
      <Stack divider={<Divider sx={{ opacity: 0.7 }} />} sx={{ mt: 0.5 }}>
        {children}
      </Stack>
    </Box>
  )
}

function SyncStatusSection({
  config,
  status,
  hasCredentials,
  googleEmail,
  hasPayloadPassword,
  safeStorageAvailable,
  children,
  listRadius
}: SyncStatusSectionProps): React.JSX.Element {
  const { t, i18n } = useTranslation()
  const theme = useTheme()
  const [copied, setCopied] = useState(false)

  const lastSyncAt = resolveLastSyncAt(status)
  const remoteId = resolveSyncRemoteId(config)
  const isGoogleProvider = config.provider === 'google-drive'
  const isGithubProvider = config.provider === 'github-gist'

  const errorReport = useMemo(() => {
    if (!status.lastError) {
      return ''
    }

    return buildSyncStatusErrorReport(status.lastError, {
      config,
      status,
      hasCredentials,
      hasPayloadPassword,
      safeStorageAvailable,
      googleEmail
    })
  }, [config, googleEmail, hasCredentials, hasPayloadPassword, safeStorageAvailable, status])

  const sectionDescription = useMemo(() => {
    if (status.lastError) {
      return t('settings.sync.statusSummaryError', {
        code: status.lastError.code
      })
    }

    if (lastSyncAt) {
      return t('settings.sync.statusSummaryOk', {
        date: formatDateTime(lastSyncAt, i18n.language)
      })
    }

    return t('settings.sync.statusSummaryEmpty')
  }, [i18n.language, lastSyncAt, status.lastError, t])

  const formatIntervalLabel = (minutes: number): string => {
    if (minutes >= 60 && minutes % 60 === 0) {
      return t('settings.autoCheckIntervalHours', { value: minutes / 60 })
    }

    return t('settings.autoCheckIntervalMinutes', { value: minutes })
  }

  const handleCopyError = async (): Promise<void> => {
    if (!errorReport) {
      return
    }

    await navigator.clipboard.writeText(errorReport)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  const scopeLabelKey = {
    full: 'settings.backup.exportKindFull',
    proxies: 'settings.backup.exportKindProxies',
    settings: 'settings.backup.exportKindSettings'
  }[config.scope]

  const boolLabel = (value: boolean): string =>
    value ? t('settings.sync.statusYes') : t('settings.sync.statusNo')

  const credentialsLabel = isGoogleProvider
    ? t('settings.sync.statusGoogleAccount')
    : t('settings.sync.statusToken')

  const credentialsValue = isGoogleProvider
    ? hasCredentials
      ? googleEmail || t('settings.sync.statusGoogleConnected')
      : t('settings.sync.statusGoogleMissing')
    : hasCredentials
      ? t('settings.sync.statusTokenSaved')
      : t('settings.sync.statusTokenMissing')

  const statusGroupsCount = 3

  return (
    <ProxyFormSection
      icon={<InfoOutlinedIcon fontSize="small" />}
      title={t('settings.sync.statusTitle')}
      description={sectionDescription}
      listRadius={listRadius}
    >
      <Stack spacing={0.75}>
        <StatusGroup
          icon={<LinkOutlinedIcon fontSize="small" />}
          title={t('settings.sync.statusConnection')}
          listRadius={getListCardRadius(getListCardPosition(0, statusGroupsCount), 12, 6)}
        >
          <StatusRow
            label={credentialsLabel}
            value={credentialsValue}
            valueColor={hasCredentials ? 'success.main' : 'warning.main'}
          />
          {isGithubProvider && (
            <StatusRow
              label={t('settings.sync.gistId')}
              value={remoteId || t('settings.sync.statusGistIdMissing')}
              valueColor={remoteId ? undefined : 'text.secondary'}
              mono={Boolean(remoteId)}
            />
          )}
          {isGoogleProvider && remoteId && (
            <StatusRow label={t('settings.sync.statusRemoteId')} value={remoteId} mono />
          )}
          <StatusRow
            label={t('settings.sync.statusSafeStorage')}
            value={
              safeStorageAvailable
                ? t('settings.sync.statusSafeStorageOk')
                : t('settings.sync.statusSafeStorageUnavailable')
            }
            valueColor={safeStorageAvailable ? 'success.main' : 'warning.main'}
          />
        </StatusGroup>

        <StatusGroup
          icon={<SettingsOutlinedIcon fontSize="small" />}
          title={t('settings.sync.statusConfiguration')}
          listRadius={getListCardRadius(getListCardPosition(1, statusGroupsCount), 12, 6)}
        >
          <StatusRow label={t('settings.sync.scope')} value={t(scopeLabelKey)} />
          <StatusRow
            label={t('settings.sync.pullMode')}
            value={
              config.pullMode === 'replace'
                ? t('settings.backup.importModeReplace')
                : t('settings.backup.importModeMerge')
            }
          />
          <StatusRow
            label={t('settings.sync.statusEncryption')}
            value={
              config.encryptPayload
                ? hasPayloadPassword
                  ? t('settings.sync.statusEncryptionOnSaved')
                  : t('settings.sync.statusEncryptionOnMissingPassword')
                : t('settings.sync.statusEncryptionOff')
            }
            valueColor={config.encryptPayload && !hasPayloadPassword ? 'warning.main' : undefined}
          />
          <StatusRow
            label={t('settings.sync.autoSyncEnabled')}
            value={
              config.autoSyncEnabled
                ? t('settings.sync.statusAutoSyncOn', {
                    interval: formatIntervalLabel(config.autoSyncIntervalMinutes)
                  })
                : t('settings.sync.statusAutoSyncOff')
            }
          />
          <StatusRow
            label={t('settings.sync.syncOnStartup')}
            value={boolLabel(config.syncOnStartup)}
          />
          <StatusRow label={t('settings.sync.pushOnChange')} value={boolLabel(config.pushOnChange)} />
        </StatusGroup>

        <StatusGroup
          icon={<HistoryOutlinedIcon fontSize="small" />}
          title={t('settings.sync.statusActivity')}
          listRadius={getListCardRadius(getListCardPosition(2, statusGroupsCount), 12, 6)}
        >
          <StatusRow
            label={t('settings.sync.lastPush')}
            value={
              status.lastPushAt
                ? formatDateTime(status.lastPushAt, i18n.language)
                : t('settings.sync.statusNotYet')
            }
            valueColor={status.lastPushAt ? undefined : 'text.secondary'}
          />
          <StatusRow
            label={t('settings.sync.lastPull')}
            value={
              status.lastPullAt
                ? formatDateTime(status.lastPullAt, i18n.language)
                : t('settings.sync.statusNotYet')
            }
            valueColor={status.lastPullAt ? undefined : 'text.secondary'}
          />
          <StatusRow
            label={t('settings.sync.remoteUpdated')}
            value={
              status.remoteUpdatedAt
                ? formatDateTime(status.remoteUpdatedAt, i18n.language)
                : t('settings.sync.statusNotYet')
            }
            valueColor={status.remoteUpdatedAt ? undefined : 'text.secondary'}
          />
          <StatusRow
            label={t('settings.sync.statusLastSync')}
            value={
              lastSyncAt ? formatDateTime(lastSyncAt, i18n.language) : t('settings.sync.statusNotYet')
            }
            valueColor={lastSyncAt ? undefined : 'text.secondary'}
          />
        </StatusGroup>
      </Stack>

      {status.lastError && (
        <Box
          sx={{
            mt: 1.5,
            borderRadius: '12px',
            overflow: 'hidden',
            border: `1px solid ${withThemeAlpha(theme, theme.palette.error.main, 0.28)}`
          }}
        >
          <Alert
            severity="error"
            variant="outlined"
            icon={<ErrorOutlineOutlinedIcon fontSize="small" />}
            sx={{ border: 'none', borderRadius: '12px', alignItems: 'flex-start', bgcolor: surfaceContainer(theme, 'default') }}
          >
            <Stack spacing={1.25}>
              <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                <Typography variant="subtitle2">{t('settings.sync.statusErrorTitle')}</Typography>
                <Chip
                  label={status.lastError.code}
                  size="small"
                  sx={{
                    height: 22,
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    bgcolor: withThemeAlpha(theme, theme.palette.error.main, 0.12),
                    color: 'error.main'
                  }}
                />
                {status.lastError.operation && (
                  <Chip
                    label={t(`settings.sync.statusOperations.${status.lastError.operation}`)}
                    size="small"
                    variant="outlined"
                    sx={{ height: 22 }}
                  />
                )}
              </Stack>

              <Typography variant="body2">{status.lastError.message}</Typography>

              {status.lastError.occurredAt && (
                <Typography variant="caption" color="text.secondary">
                  {t('settings.sync.statusErrorOccurredAt', {
                    date: formatDateTime(status.lastError.occurredAt, i18n.language)
                  })}
                </Typography>
              )}

              <Box
                component="pre"
                sx={{
                  m: 0,
                  p: 1.25,
                  borderRadius: '10px',
                  bgcolor: surfaceContainer(theme, 'high'),
                  border: `1px solid ${outlineVariant(theme)}`,
                  fontFamily: 'monospace',
                  fontSize: '0.74rem',
                  lineHeight: 1.45,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  maxHeight: 220,
                  overflow: 'auto'
                }}
              >
                {errorReport}
              </Box>

              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={() => void handleCopyError()}
                startIcon={copied ? <CheckIcon /> : <ContentCopyIcon />}
                sx={{ alignSelf: 'flex-start', borderRadius: '999px', px: 2 }}
              >
                {copied ? t('common.copied') : t('settings.sync.statusCopyError')}
              </Button>
            </Stack>
          </Alert>
        </Box>
      )}

      {!status.lastError && !lastSyncAt && (
        <Box
          sx={{
            mt: 1,
            p: 2,
            borderRadius: '12px',
            bgcolor: surfaceContainer(theme, 'default'),
            border: `1px dashed ${withThemeAlpha(theme, theme.palette.divider, 0.7)}`,
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            color: 'text.secondary'
          }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: surfaceTint(theme, 'primary', 0.1),
              color: 'text.secondary'
            }}
          >
            <HistoryOutlinedIcon fontSize="small" />
          </Box>
          <Typography variant="body2" sx={{ fontStyle: 'italic', lineHeight: 1.4 }}>
            {t('settings.sync.statusEmpty')}
          </Typography>
        </Box>
      )}

      {children ? <Box sx={{ mt: 0.5 }}>{children}</Box> : null}
    </ProxyFormSection>
  )
}

export default SyncStatusSection
