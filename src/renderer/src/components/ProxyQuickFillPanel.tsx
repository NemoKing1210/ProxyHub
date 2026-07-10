import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined'
import {
  Box,
  Chip,
  Divider,
  FormHelperText,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import { MD3_DURATION, MD3_EASING, outlineVariant, surfaceContainer, withThemeAlpha } from '../theme'

const QUICK_FILL_EXAMPLES = ['host:port', 'user:pass@host:port', 'socks5://host:port'] as const

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
    <Box
      sx={{
        p: 2,
        borderRadius: 2.5,
        bgcolor: withThemeAlpha(theme, theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.1 : 0.06),
        boxShadow: `inset 0 0 0 1px ${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.28 : 0.16)}`
      }}
    >
      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'flex-start', mb: 1.75 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: 2,
            flexShrink: 0,
            bgcolor: surfaceContainer(theme, 'high'),
            color: 'primary.main'
          }}
        >
          <LinkOutlinedIcon sx={{ fontSize: 18 }} />
        </Box>
        <Box sx={{ minWidth: 0, pt: 0.125 }}>
          <Typography variant="subtitle2" sx={{ lineHeight: 1.3 }}>
            {t('proxyForm.quickFill')}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
            {t('proxyForm.quickFillHint')}
          </Typography>
        </Box>
      </Stack>

      <TextField
        fullWidth
        size="small"
        placeholder={t('proxyForm.quickFillPlaceholder')}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        error={Boolean(error)}
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

      {error ? (
        <FormHelperText error sx={{ mx: 0, mt: 0.75 }}>
          {error}
        </FormHelperText>
      ) : null}

      <Stack direction="row" spacing={0.75} useFlexGap sx={{ mt: 1.25, flexWrap: 'wrap' }}>
        {QUICK_FILL_EXAMPLES.map((example) => (
          <Chip
            key={example}
            label={example}
            size="small"
            variant="outlined"
            clickable
            onClick={() => onChange(example)}
            sx={{
              height: 26,
              fontFamily: 'monospace',
              fontSize: '0.68rem',
              letterSpacing: '0.01em',
              borderColor: outlineVariant(theme),
              bgcolor:
                theme.palette.mode === 'dark'
                  ? surfaceContainer(theme, 'highest')
                  : theme.palette.background.paper,
              color: theme.palette.text.primary,
              transition: `background-color ${MD3_DURATION.short4}ms ${MD3_EASING.standard}, border-color ${MD3_DURATION.short4}ms ${MD3_EASING.standard}, color ${MD3_DURATION.short4}ms ${MD3_EASING.standard}`,
              '& .MuiChip-label': {
                px: 1,
                py: 0.25,
                color: 'inherit'
              },
              '&:hover': {
                borderColor: theme.palette.primary.main,
                bgcolor: withThemeAlpha(
                  theme,
                  theme.palette.primary.main,
                  theme.palette.mode === 'dark' ? 0.24 : 0.1
                ),
                color: theme.palette.primary.main
              }
            }}
          />
        ))}
      </Stack>

      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mt: 2 }}>
        <Divider sx={{ flex: 1 }} />
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.62rem' }}
        >
          {t('proxyForm.quickFillOrManual')}
        </Typography>
        <Divider sx={{ flex: 1 }} />
      </Stack>
    </Box>
  )
}

export default ProxyQuickFillPanel
