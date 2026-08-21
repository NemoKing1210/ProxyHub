import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import { Alert, AlertTitle, Snackbar, Typography } from '@mui/material'
import { useEffect } from 'react'
import type { ToastPosition } from '../../../shared/types/settings'
import { useSettingsStore } from '../store/settingsStore'
import { useToastStore } from '../store/toastStore'

const severityIcons = {
  success: CheckCircleOutlinedIcon,
  warning: WarningAmberOutlinedIcon,
  error: ErrorOutlineOutlinedIcon
} as const

const toastAnchors: Record<
  ToastPosition,
  { vertical: 'top' | 'bottom'; horizontal: 'left' | 'center' | 'right' }
> = {
  'top-left': { vertical: 'top', horizontal: 'left' },
  'top-center': { vertical: 'top', horizontal: 'center' },
  'top-right': { vertical: 'top', horizontal: 'right' },
  'bottom-left': { vertical: 'bottom', horizontal: 'left' },
  'bottom-center': { vertical: 'bottom', horizontal: 'center' },
  'bottom-right': { vertical: 'bottom', horizontal: 'right' }
}

function CheckToastHost(): React.JSX.Element {
  const current = useToastStore((state) => state.current)
  const dismiss = useToastStore((state) => state.dismiss)
  const clear = useToastStore((state) => state.clear)
  const toastEnabled = useSettingsStore((state) => state.settings.toastEnabled)
  const toastPosition = useSettingsStore((state) => state.settings.toastPosition)
  const Icon = current ? severityIcons[current.severity] : null

  useEffect(() => {
    if (!toastEnabled) {
      clear()
    }
  }, [clear, toastEnabled])

  return (
    <Snackbar
      key={current?.id}
      open={toastEnabled && current !== null}
      autoHideDuration={current?.duration ?? 4500}
      onClose={(_, reason) => {
        if (reason === 'clickaway') return
        dismiss()
      }}
      anchorOrigin={toastAnchors[toastPosition]}
    >
      {current && Icon ? (
        <Alert
          severity={current.severity}
          variant="filled"
          icon={<Icon fontSize="inherit" />}
          onClose={dismiss}
          sx={{
            width: '100%',
            minWidth: { xs: 280, sm: 360 },
            maxWidth: 480,
            alignItems: 'flex-start',
            '& .MuiAlert-message': {
              width: '100%'
            },
            '& .MuiAlert-icon': {
              opacity: 0.95,
              mt: 0.25
            }
          }}
        >
          <AlertTitle sx={{ mb: current.message ? 0.5 : 0, fontWeight: 700, lineHeight: 1.35 }}>
            {current.title}
          </AlertTitle>
          {current.message ? (
            <Typography
              variant="body2"
              sx={{ opacity: 0.92, lineHeight: 1.45, whiteSpace: 'pre-line' }}
            >
              {current.message}
            </Typography>
          ) : null}
        </Alert>
      ) : undefined}
    </Snackbar>
  )
}

export default CheckToastHost
