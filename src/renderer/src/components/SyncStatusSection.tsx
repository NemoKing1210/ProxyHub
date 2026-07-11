import CheckIcon from '@mui/icons-material/Check'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined'
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Stack,
  Typography
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { SyncConfig, SyncPublicState } from '../../../shared/types/sync'
import { formatDateTime } from '../../../shared/utils/datetime'
import {
  buildSyncStatusErrorReport,
  resolveLastSyncAt
} from '../../../shared/utils/sync-status'
import ProxyFormSection from './ProxyFormSection'
import { outlineVariant, surfaceContainer, withThemeAlpha } from '../theme'

interface SyncStatusSectionProps {
  config: SyncConfig
  status: SyncPublicState['status']
  hasToken: boolean
  hasPayloadPassword: boolean
  safeStorageAvailable: boolean
}

interface StatusRowProps {
  label: string
  value: React.ReactNode
  valueColor?: string
}

function StatusRow({ label, value, valueColor }: StatusRowProps): React.JSX.Element {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'minmax(150px, 40%) 1fr' },
        gap: { xs: 0.35, sm: 1.5 },
        py: 0.8
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 500,
          wordBreak: 'break-word',
          color: valueColor
        }}
      >
        {value}
      </Typography>
    </Box>
  )
}

function StatusGroup({
  title,
  children
}: {
  title: string
  children: React.ReactNode
}): React.JSX.Element {
  const theme = useTheme()

  return (
    <Box
      sx={{
        px: 1.5,
        py: 0.5,
        borderRadius: 2.5,
        bgcolor: surfaceContainer(theme, 'low'),
        boxShadow: `inset 0 0 0 1px ${outlineVariant(theme)}`
      }}
    >
      <Typography variant="subtitle2" sx={{ py: 0.85 }}>
        {title}
      </Typography>
      <Divider sx={{ mb: 0.25 }} />
      {children}
    </Box>
  )
}

function SyncStatusSection({
  config,
  status,
  hasToken,
  hasPayloadPassword,
  safeStorageAvailable
}: SyncStatusSectionProps): React.JSX.Element {
  const { t, i18n } = useTranslation()
  const theme = useTheme()
  const [copied, setCopied] = useState(false)

  const lastSyncAt = resolveLastSyncAt(status)
  const errorReport = useMemo(() => {
    if (!status.lastError) {
      return ''
    }

    return buildSyncStatusErrorReport(status.lastError, {
      config,
      status,
      hasToken,
      hasPayloadPassword,
      safeStorageAvailable
    })
  }, [config, hasPayloadPassword, hasToken, safeStorageAvailable, status])

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

  return (
    <ProxyFormSection
      icon={<InfoOutlinedIcon fontSize="small" />}
      title={t('settings.sync.statusTitle')}
      description={sectionDescription}
      collapsible
      defaultExpanded={false}
    >
      <StatusGroup title={t('settings.sync.statusConnection')}>
        <StatusRow
          label={t('settings.sync.statusToken')}
          value={
            hasToken ? t('settings.sync.statusTokenSaved') : t('settings.sync.statusTokenMissing')
          }
          valueColor={hasToken ? 'success.main' : 'warning.main'}
        />
        <Divider />
        <StatusRow
          label={t('settings.sync.gistId')}
          value={config.gistId || t('settings.sync.statusGistIdMissing')}
          valueColor={config.gistId ? undefined : 'text.secondary'}
        />
        <Divider />
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

      <StatusGroup title={t('settings.sync.statusConfiguration')}>
        <StatusRow label={t('settings.sync.scope')} value={t(scopeLabelKey)} />
        <Divider />
        <StatusRow
          label={t('settings.sync.pullMode')}
          value={
            config.pullMode === 'replace'
              ? t('settings.backup.importModeReplace')
              : t('settings.backup.importModeMerge')
          }
        />
        <Divider />
        <StatusRow
          label={t('settings.sync.statusEncryption')}
          value={
            config.encryptPayload
              ? hasPayloadPassword
                ? t('settings.sync.statusEncryptionOnSaved')
                : t('settings.sync.statusEncryptionOnMissingPassword')
              : t('settings.sync.statusEncryptionOff')
          }
          valueColor={
            config.encryptPayload && !hasPayloadPassword ? 'warning.main' : undefined
          }
        />
        <Divider />
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
        <Divider />
        <StatusRow
          label={t('settings.sync.syncOnStartup')}
          value={boolLabel(config.syncOnStartup)}
        />
        <Divider />
        <StatusRow
          label={t('settings.sync.pushOnChange')}
          value={boolLabel(config.pushOnChange)}
        />
      </StatusGroup>

      <StatusGroup title={t('settings.sync.statusActivity')}>
        <StatusRow
          label={t('settings.sync.lastPush')}
          value={
            status.lastPushAt
              ? formatDateTime(status.lastPushAt, i18n.language)
              : t('settings.sync.statusNotYet')
          }
          valueColor={status.lastPushAt ? undefined : 'text.secondary'}
        />
        <Divider />
        <StatusRow
          label={t('settings.sync.lastPull')}
          value={
            status.lastPullAt
              ? formatDateTime(status.lastPullAt, i18n.language)
              : t('settings.sync.statusNotYet')
          }
          valueColor={status.lastPullAt ? undefined : 'text.secondary'}
        />
        <Divider />
        <StatusRow
          label={t('settings.sync.remoteUpdated')}
          value={
            status.remoteUpdatedAt
              ? formatDateTime(status.remoteUpdatedAt, i18n.language)
              : t('settings.sync.statusNotYet')
          }
          valueColor={status.remoteUpdatedAt ? undefined : 'text.secondary'}
        />
        <Divider />
        <StatusRow
          label={t('settings.sync.statusLastSync')}
          value={
            lastSyncAt
              ? formatDateTime(lastSyncAt, i18n.language)
              : t('settings.sync.statusNotYet')
          }
          valueColor={lastSyncAt ? undefined : 'text.secondary'}
        />
      </StatusGroup>

      {status.lastError && (
        <Box
          sx={{
            borderRadius: 2.5,
            overflow: 'hidden',
            boxShadow: `inset 0 0 0 1px ${withThemeAlpha(theme, theme.palette.error.main, 0.35)}`
          }}
        >
          <Alert
            severity="error"
            variant="outlined"
            icon={<ErrorOutlineOutlinedIcon fontSize="small" />}
            sx={{ borderRadius: 0, alignItems: 'flex-start' }}
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
                  borderRadius: 2,
                  bgcolor: surfaceContainer(theme, 'high'),
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
                sx={{ alignSelf: 'flex-start' }}
              >
                {copied ? t('common.copied') : t('settings.sync.statusCopyError')}
              </Button>
            </Stack>
          </Alert>
        </Box>
      )}

      {!status.lastError && !lastSyncAt && (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', color: 'text.secondary' }}>
          <TimelineOutlinedIcon fontSize="small" />
          <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
            {t('settings.sync.statusEmpty')}
          </Typography>
        </Stack>
      )}
    </ProxyFormSection>
  )
}

export default SyncStatusSection
