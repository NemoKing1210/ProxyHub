import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import CloudDownloadOutlinedIcon from '@mui/icons-material/CloudDownloadOutlined'
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined'
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined'
import SystemUpdateAltOutlinedIcon from '@mui/icons-material/SystemUpdateAltOutlined'
import UpdateOutlinedIcon from '@mui/icons-material/UpdateOutlined'
import { Alert, Box, Button, Chip, LinearProgress, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AppUpdateState } from '@shared/types/updater'
import ContentSection from '../../../components/ui/ContentSection'
import { outlineVariant, surfaceContainer, surfaceTint, withThemeAlpha } from '../../../theme'

function formatMegabytes(value: number | undefined): string | undefined {
  if (value === undefined) return undefined
  return (value / (1024 * 1024)).toFixed(1)
}

function StatusIcon({ status }: { status: AppUpdateState['status'] }): React.JSX.Element {
  switch (status) {
    case 'checking':
    case 'downloading':
      return <CloudDownloadOutlinedIcon color="primary" sx={{ fontSize: 28 }} />
    case 'available':
      return <SystemUpdateAltOutlinedIcon color="primary" sx={{ fontSize: 28 }} />
    case 'downloaded':
      return <CheckCircleOutlineRoundedIcon color="primary" sx={{ fontSize: 28 }} />
    case 'not-available':
      return <CheckCircleOutlineRoundedIcon color="primary" sx={{ fontSize: 28 }} />
    case 'error':
      return <ErrorOutlineRoundedIcon color="primary" sx={{ fontSize: 28 }} />
    default:
      return <InfoOutlinedIcon color="primary" sx={{ fontSize: 28 }} />
  }
}

interface AppUpdateSectionProps {
  listRadius?: string
}

function AppUpdateSection({ listRadius }: AppUpdateSectionProps): React.JSX.Element | null {
  const { t } = useTranslation()
  const theme = useTheme()
  const [state, setState] = useState<AppUpdateState | null>(null)
  const [isBusy, setIsBusy] = useState(false)

  useEffect(() => {
    let active = true
    void window.api.getUpdateState().then((next) => {
      if (active) setState(next)
    })
    const unsubscribe = window.api.onUpdateStateChange((next) => {
      if (active) {
        setState(next)
        setIsBusy(next.status === 'checking' || next.status === 'downloading')
      }
    })
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const runCheck = useCallback(async (): Promise<void> => {
    setIsBusy(true)
    try {
      const next = await window.api.checkForUpdates()
      setState(next)
    } finally {
      setIsBusy(false)
    }
  }, [])

  const runDownload = useCallback(async (): Promise<void> => {
    setIsBusy(true)
    try {
      const next = await window.api.downloadUpdate()
      setState(next)
    } finally {
      setIsBusy(false)
    }
  }, [])

  const runInstall = useCallback((): void => {
    void window.api.installUpdate()
  }, [])

  if (!state) return null

  if (state.status === 'disabled') return null

  const transferred = formatMegabytes(state.transferredBytes)
  const total = formatMegabytes(state.totalBytes)
  const showProgress = state.status === 'downloading'
  const canCheck =
    !isBusy && (state.status === 'idle' || state.status === 'not-available' || state.status === 'available' || state.status === 'error')
  const canDownload = !isBusy && state.status === 'available'
  const canInstall = state.status === 'downloaded'

  const statusChipLabel: Record<string, string> = {
    idle: t('settings.updates.checkButton', { defaultValue: 'Ready' }),
    checking: t('settings.updates.checking', { defaultValue: 'Checking…' }),
    'not-available': t('settings.aboutPage.updateUpToDate', { defaultValue: 'Up to date' }),
    available: t('settings.aboutPage.updateAvailable', { defaultValue: 'Update available' }),
    downloading: t('settings.updates.downloading', { defaultValue: 'Downloading…' }),
    downloaded: t('settings.aboutPage.updateReady', { defaultValue: 'Ready to install' }),
    error: t('settings.aboutPage.updateError', { defaultValue: 'Error' })
  }


  return (
    <ContentSection icon={<UpdateOutlinedIcon fontSize="small" />} title={t('settings.updates.title')} listRadius={listRadius}>
      <Stack spacing={1.75}>
      {/* status header */}
      <Box
        sx={{
          p: 2,
          borderRadius: '12px',
          bgcolor: surfaceContainer(theme, 'default'),
          border: `1px solid ${outlineVariant(theme)}`,
          display: 'flex',
          gap: 1.75,
          alignItems: 'flex-start'
        }}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            bgcolor: surfaceTint(theme, 'primary', 0.14),
            color: 'primary.main',
            border: `1px solid ${withThemeAlpha(theme, theme.palette.primary.main, 0.18)}`
          }}
        >
          <StatusIcon status={state.status} />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', mb: 0.35 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              {t('settings.updates.title')}
            </Typography>
            <Chip
              label={statusChipLabel[state.status] ?? state.status}
              size="small"
              color={
                state.status === 'not-available' || state.status === 'downloaded'
                  ? 'success'
                  : state.status === 'available'
                    ? 'info'
                    : state.status === 'error'
                      ? 'warning'
                      : 'default'
              }
              sx={{ height: 20, fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.02em' }}
            />
            {state.currentVersion && (
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                v{state.currentVersion}
              </Typography>
            )}
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5, fontSize: '0.86rem' }}>
            {t('settings.updates.description')}
          </Typography>

          {/* inline status messages */}
          <Box sx={{ mt: 1.25 }}>
            {state.status === 'checking' && (
              <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main', animation: 'pulse 1.2s infinite' }} />
                {t('settings.updates.checking')}
              </Typography>
            )}

            {state.status === 'not-available' && (
              <Alert severity="success" variant="outlined" sx={{ borderRadius: '12px', py: 0.25, fontSize: '0.86rem' }}>
                {t('settings.updates.upToDate', { version: state.currentVersion })}
              </Alert>
            )}

            {state.status === 'available' && state.availableVersion && (
              <Alert severity="info" variant="outlined" sx={{ borderRadius: '12px', py: 0.25, fontSize: '0.86rem' }}>
                {t('settings.updates.available', { version: state.availableVersion })}
              </Alert>
            )}

            {state.status === 'downloaded' && state.availableVersion && (
              <Alert severity="success" variant="outlined" sx={{ borderRadius: '12px', py: 0.25, fontSize: '0.86rem' }}>
                {t('settings.updates.ready', { version: state.availableVersion })}
              </Alert>
            )}

            {state.status === 'error' && (
              <Alert severity="warning" variant="outlined" sx={{ borderRadius: '12px', py: 0.25, fontSize: '0.86rem' }}>
                {t(`settings.updates.errors.${state.errorCode ?? 'unavailable'}` as const)}
              </Alert>
            )}

            {state.releaseNotes && (state.status === 'available' || state.status === 'downloaded') && (
              <Box
                sx={{
                  mt: 1,
                  p: 1.25,
                  borderRadius: '12px',
                  bgcolor: withThemeAlpha(theme, theme.palette.background.paper, 0.7),
                  border: `1px solid ${withThemeAlpha(theme, theme.palette.divider, 0.5)}`,
                  maxHeight: 140,
                  overflow: 'auto'
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
                  Release notes
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.84rem', lineHeight: 1.6 }}>
                  {state.releaseNotes}
                </Typography>
              </Box>
            )}

            {showProgress && (
              <Box sx={{ mt: 1.25 }}>
                <LinearProgress
                  variant={state.downloadPercent !== undefined ? 'determinate' : 'indeterminate'}
                  value={state.downloadPercent}
                  sx={{ height: 6, borderRadius: 999, bgcolor: withThemeAlpha(theme, theme.palette.primary.main, 0.12) }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block' }}>
                  {state.downloadPercent !== undefined
                    ? t('settings.updates.downloadProgress', {
                        percent: Math.round(state.downloadPercent),
                        transferred: transferred ?? '—',
                        total: total ?? '—'
                      })
                    : t('settings.updates.downloading')}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          startIcon={<RefreshOutlinedIcon />}
          disabled={!canCheck}
          onClick={() => void runCheck()}
          sx={{ borderRadius: '999px', fontWeight: 700, px: 2 }}
        >
          {t('settings.updates.checkButton')}
        </Button>

        {canDownload && (
          <Button
            variant="contained"
            startIcon={<DownloadOutlinedIcon />}
            onClick={() => void runDownload()}
            sx={{ borderRadius: '999px', fontWeight: 700, px: 2 }}
          >
            {t('settings.updates.downloadButton', { version: state.availableVersion ?? '' })}
          </Button>
        )}

        {canInstall && (
          <Button
            variant="contained"
            color="success"
            startIcon={<RestartAltOutlinedIcon />}
            onClick={runInstall}
            sx={{ borderRadius: '999px', fontWeight: 700, px: 2 }}
          >
            {t('settings.updates.installButton')}
          </Button>
        )}
      </Stack>

        <style>{`@keyframes pulse{0%{opacity:1}50%{opacity:0.35}100%{opacity:1}}`}</style>
      </Stack>
    </ContentSection>
  )
}

export default AppUpdateSection
