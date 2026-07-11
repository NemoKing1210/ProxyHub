import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined'
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined'
import SystemUpdateAltOutlinedIcon from '@mui/icons-material/SystemUpdateAltOutlined'
import { Alert, Box, Button, LinearProgress, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AppUpdateState } from '../../../shared/types/updater'
import { surfaceContainer } from '../theme'

function formatMegabytes(value: number | undefined): string | undefined {
  if (value === undefined) {
    return undefined
  }

  return (value / (1024 * 1024)).toFixed(1)
}

function AppUpdateSection(): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const [state, setState] = useState<AppUpdateState | null>(null)
  const [isBusy, setIsBusy] = useState(false)

  useEffect(() => {
    let active = true

    void window.api.getUpdateState().then((next) => {
      if (active) {
        setState(next)
      }
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

  if (!state || state.status === 'disabled') {
    return (
      <Alert severity="info" variant="outlined" sx={{ mb: 2.5 }}>
        {t('settings.updates.disabledHint')}
      </Alert>
    )
  }

  const transferred = formatMegabytes(state.transferredBytes)
  const total = formatMegabytes(state.totalBytes)
  const showProgress = state.status === 'downloading'
  const canCheck =
    !isBusy &&
    (state.status === 'idle' ||
      state.status === 'not-available' ||
      state.status === 'available' ||
      state.status === 'error')
  const canDownload = !isBusy && state.status === 'available'
  const canInstall = state.status === 'downloaded'

  return (
    <Box
      sx={{
        p: 2,
        mb: 2.5,
        borderRadius: 2.5,
        bgcolor: surfaceContainer(theme, 'low')
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <SystemUpdateAltOutlinedIcon color="primary" fontSize="small" />
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2">{t('settings.updates.title')}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t('settings.updates.description')}
            </Typography>
          </Box>
        </Stack>

        {state.status === 'checking' && (
          <Typography variant="body2" color="text.secondary">
            {t('settings.updates.checking')}
          </Typography>
        )}

        {state.status === 'not-available' && (
          <Alert severity="success" variant="outlined">
            {t('settings.updates.upToDate', { version: state.currentVersion })}
          </Alert>
        )}

        {state.status === 'available' && state.availableVersion && (
          <Alert severity="info" variant="outlined">
            {t('settings.updates.available', { version: state.availableVersion })}
          </Alert>
        )}

        {state.status === 'downloaded' && state.availableVersion && (
          <Alert severity="success" variant="outlined">
            {t('settings.updates.ready', { version: state.availableVersion })}
          </Alert>
        )}

        {state.status === 'error' && (
          <Alert severity="warning" variant="outlined">
            {t(`settings.updates.errors.${state.errorCode ?? 'unavailable'}`)}
          </Alert>
        )}

        {state.releaseNotes && (state.status === 'available' || state.status === 'downloaded') && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              whiteSpace: 'pre-wrap',
              maxHeight: 160,
              overflow: 'auto',
              fontFamily: 'inherit'
            }}
          >
            {state.releaseNotes}
          </Typography>
        )}

        {showProgress && (
          <Box>
            <LinearProgress
              variant={state.downloadPercent !== undefined ? 'determinate' : 'indeterminate'}
              value={state.downloadPercent}
              sx={{ mb: 0.75, borderRadius: 999 }}
            />
            <Typography variant="caption" color="text.secondary">
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

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshOutlinedIcon />}
            disabled={!canCheck}
            onClick={() => void runCheck()}
          >
            {t('settings.updates.checkButton')}
          </Button>

          {canDownload && (
            <Button
              variant="contained"
              startIcon={<DownloadOutlinedIcon />}
              onClick={() => void runDownload()}
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
            >
              {t('settings.updates.installButton')}
            </Button>
          )}
        </Stack>
      </Stack>
    </Box>
  )
}

export default AppUpdateSection
