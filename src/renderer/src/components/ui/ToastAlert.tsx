import { Alert, type AlertProps } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { elevationShadow, getPalette, withThemeAlpha } from '../../theme'

export type ToastSeverity = 'success' | 'warning' | 'error'

interface ToastAlertProps extends Omit<AlertProps, 'variant' | 'severity'> {
  severity: ToastSeverity
}

/**
 * App-styled toast surface: a blurred tonal card with a hairline accent
 * border instead of MUI's fully filled severity backgrounds. Only the icon
 * keeps the severity color.
 */
function ToastAlert({ severity, sx, children, ...rest }: ToastAlertProps): React.JSX.Element {
  const theme = useTheme()
  const palette = getPalette(theme)

  return (
    <Alert
      severity={severity}
      variant="standard"
      {...rest}
      sx={{
        width: '100%',
        borderRadius: '16px',
        color: 'text.primary',
        bgcolor: withThemeAlpha(
          theme,
          palette.background.paper,
          theme.palette.mode === 'dark' ? 0.72 : 0.92
        ),
        border: `1px solid ${withThemeAlpha(theme, palette.primary.main, 0.16)}`,
        boxShadow: elevationShadow(theme, 3),
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        '& .MuiAlert-icon': {
          color: palette[severity].main,
          opacity: 0.95,
          mt: 0.25
        },
        '& .MuiAlert-action': {
          color: 'text.secondary',
          alignSelf: 'flex-start'
        },
        ...sx
      }}
    >
      {children}
    </Alert>
  )
}

export default ToastAlert
