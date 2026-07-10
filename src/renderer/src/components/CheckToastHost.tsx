import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import { Alert, AlertTitle, Snackbar, Typography } from '@mui/material'
import { useToastStore } from '../store/toastStore'

const severityIcons = {
  success: CheckCircleOutlinedIcon,
  warning: WarningAmberOutlinedIcon,
  error: ErrorOutlineOutlinedIcon
} as const

function CheckToastHost(): React.JSX.Element {
  const current = useToastStore((state) => state.current)
  const dismiss = useToastStore((state) => state.dismiss)
  const Icon = current ? severityIcons[current.severity] : null

  return (
    <Snackbar
      key={current?.id}
      open={current !== null}
      autoHideDuration={current?.duration ?? 4500}
      onClose={(_, reason) => {
        if (reason === 'clickaway') return
        dismiss()
      }}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
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
            <Typography variant="body2" sx={{ opacity: 0.92, lineHeight: 1.45 }}>
              {current.message}
            </Typography>
          ) : null}
        </Alert>
      ) : undefined}
    </Snackbar>
  )
}

export default CheckToastHost
