import { Box, Collapse, LinearProgress, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import { elevationShadow, getPalette, MD3_DURATION, MD3_EASING, withThemeAlpha } from '../../theme'
import type { ProxyCheckProgress } from '../../lib/proxy-check-progress'

interface ProxyCheckProgressBarProps {
  progress: ProxyCheckProgress | null
  indeterminate?: boolean
  sx?: object
}

function ProxyCheckProgressBar({
  progress,
  indeterminate = false,
  sx
}: ProxyCheckProgressBarProps): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const palette = getPalette(theme)
  const isActive = progress !== null || indeterminate

  return (
    <Collapse
      in={isActive}
      unmountOnExit
      timeout={{ enter: MD3_DURATION.medium3, exit: MD3_DURATION.medium2 }}
    >
      <Box
        role="status"
        aria-label={
          progress
            ? t('nav.checkProgress', {
                completed: progress.completed,
                total: progress.total
              })
            : t('nav.checking')
        }
        sx={{
          px: 1.25,
          py: 1,
          borderRadius: '16px',
          bgcolor: withThemeAlpha(
            theme,
            palette.background.paper,
            theme.palette.mode === 'dark' ? 0.42 : 0.72
          ),
          border: `1px solid ${withThemeAlpha(theme, palette.primary.main, 0.18)}`,
          boxShadow: elevationShadow(theme, 1),
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          ...sx
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 1.5,
            mb: 0.75
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              letterSpacing: '0.02em',
              color: 'primary.main',
              textTransform: 'uppercase',
              fontSize: '0.68rem'
            }}
          >
            {t('nav.checking')}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
            <Typography
              component="span"
              variant="caption"
              sx={{
                fontWeight: 700,
                fontSize: '0.8rem',
                fontVariantNumeric: 'tabular-nums',
                color: 'text.primary',
                lineHeight: 1
              }}
            >
              {progress ? `${progress.completed} / ${progress.total}` : `0 / 1`}
            </Typography>

            {progress ? (
              <Typography
                component="span"
                variant="caption"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.72rem',
                  fontVariantNumeric: 'tabular-nums',
                  color: 'text.secondary',
                  lineHeight: 1
                }}
              >
                {Math.round(progress.value)}%
              </Typography>
            ) : null}
          </Box>
        </Box>

        <LinearProgress
          variant={progress ? 'determinate' : 'indeterminate'}
          value={progress?.value}
          sx={{
            height: 6,
            borderRadius: '999px',
            bgcolor: withThemeAlpha(theme, palette.primary.main, 0.14),
            '& .MuiLinearProgress-bar': {
              borderRadius: '999px',
              backgroundImage: `linear-gradient(90deg, ${palette.primary.dark}, ${palette.primary.main}, ${palette.primary.light})`,
              transition: `transform ${MD3_DURATION.medium2}ms ${MD3_EASING.standard}`
            }
          }}
        />
      </Box>
    </Collapse>
  )
}

export default ProxyCheckProgressBar
