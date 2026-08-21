import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import { IconButton, InputAdornment, TextField, Tooltip } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import { MD3_DURATION, MD3_EASING, surfaceContainer, withThemeAlpha } from '../theme'

interface ProxyQuickFillPanelProps {
  value: string
  error: string | null
  onChange: (value: string) => void
  onApply: () => void
}

function ProxyQuickFillPanel({
  value,
  error,
  onChange,
  onApply
}: ProxyQuickFillPanelProps): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const canApply = Boolean(value.trim())

  const handleKeyDown = (event: React.KeyboardEvent): void => {
    if (event.key === 'Enter') {
      event.preventDefault()
      onApply()
    }
  }

  return (
    <TextField
      fullWidth
      size="small"
      placeholder={t('proxyForm.quickFillPlaceholder')}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={handleKeyDown}
      error={Boolean(error)}
      helperText={error ?? undefined}
      slotProps={{
        input: {
          sx: {
            fontFamily: 'monospace',
            fontSize: '0.84rem',
            letterSpacing: '0.01em',
            bgcolor: surfaceContainer(theme, 'low'),
            transition: `background-color ${MD3_DURATION.short4}ms ${MD3_EASING.standard}, box-shadow ${MD3_DURATION.short4}ms ${MD3_EASING.standard}`,
            '&:hover': {
              bgcolor: surfaceContainer(theme, 'default')
            },
            '&.Mui-focused': {
              bgcolor: surfaceContainer(theme, 'default')
            }
          },
          endAdornment: (
            <InputAdornment position="end">
              <Tooltip title={t('proxyForm.quickFillApply')}>
                <span>
                  <IconButton
                    edge="end"
                    color="primary"
                    disabled={!canApply}
                    onClick={onApply}
                    aria-label={t('proxyForm.quickFillApply')}
                    sx={{
                      width: 34,
                      height: 34,
                      bgcolor: canApply
                        ? withThemeAlpha(theme, theme.palette.primary.main, 0.14)
                        : 'transparent',
                      transition: `background-color ${MD3_DURATION.short4}ms ${MD3_EASING.standard}, transform ${MD3_DURATION.short3}ms ${MD3_EASING.standard}`,
                      '&:hover': {
                        bgcolor: withThemeAlpha(theme, theme.palette.primary.main, 0.22)
                      },
                      '&:active': {
                        transform: 'scale(0.94)'
                      }
                    }}
                  >
                    <ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </span>
              </Tooltip>
            </InputAdornment>
          )
        }
      }}
    />
  )
}

export default ProxyQuickFillPanel
