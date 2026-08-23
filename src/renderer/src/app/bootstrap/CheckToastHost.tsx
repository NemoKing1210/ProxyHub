import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import { AlertTitle, Snackbar, Typography } from '@mui/material'
import { useEffect } from 'react'
import type { ToastPosition } from '@shared/types/settings'
import { TITLE_BAR_HEIGHT } from '@shared/theme/title-bar'
import { isWindows } from '../../lib/platform'
import ToastAlert, { type ToastSeverity } from '../../components/ui/ToastAlert'
import { useSettingsStore } from '../../store/settingsStore'
import { useToastStore } from '../../store/toastStore'

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
  // Top-anchored toasts must clear the fixed app header: the custom title
  // bar on Windows, or the floating navigation pill on other platforms.
  const topOffset = isWindows() ? TITLE_BAR_HEIGHT + 8 : 72
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
      sx={{
        [`&.MuiSnackbar-anchorOriginTopLeft, &.MuiSnackbar-anchorOriginTopCenter,
          &.MuiSnackbar-anchorOriginTopRight`]: {
          top: topOffset
        }
      }}
    >
      {current && Icon ? (
        <ToastAlert
          severity={current.severity as ToastSeverity}
          icon={<Icon fontSize="inherit" />}
          onClose={dismiss}
          sx={{
            minWidth: { xs: 280, sm: 360 },
            maxWidth: 480,
            alignItems: 'flex-start',
            '& .MuiAlert-message': {
              width: '100%'
            }
          }}
        >
          <AlertTitle sx={{ mb: 0.5, fontWeight: 700, lineHeight: 1.35 }}>
            {current.title}
          </AlertTitle>
          <Typography
            variant="body2"
            sx={{ opacity: 0.92, lineHeight: 1.45, whiteSpace: 'pre-line' }}
          >
            {current.message}
          </Typography>
        </ToastAlert>
      ) : undefined}
    </Snackbar>
  )
}

export default CheckToastHost
