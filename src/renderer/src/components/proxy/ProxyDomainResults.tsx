import { Box, Chip, CircularProgress, Stack, Typography } from '@mui/material'
import { keyframes, useTheme, type Theme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import type { ProxyDomainCheckResult } from '@shared/types/proxy'
import { getPalette, MD3_EASING, staggerDelay, withThemeAlpha } from '../../theme'
import LatencyText from '../ui/LatencyText'

interface ProxyDomainResultsProps {
  domainChecks: ProxyDomainCheckResult[]
}

const domainEnter = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`

function getDomainStyles(
  status: ProxyDomainCheckResult['status'],
  theme: Theme
): { bgcolor: string } {
  const palette = getPalette(theme)

  if (status === 'alive') {
    return {
      bgcolor: withThemeAlpha(theme, palette.success.main, 0.14)
    }
  }

  if (status === 'dead') {
    return {
      bgcolor: withThemeAlpha(theme, palette.error.main, 0.14)
    }
  }

  if (status === 'checking') {
    return {
      bgcolor: withThemeAlpha(theme, palette.info.main, 0.16)
    }
  }

  return {
    bgcolor: withThemeAlpha(theme, palette.text.primary, 0.06)
  }
}

function ProxyDomainResults({ domainChecks }: ProxyDomainResultsProps): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const palette = getPalette(theme)

  return (
    <Stack spacing={1}>
      {domainChecks.map((check, index) => {
        const styles = getDomainStyles(check.status, theme)
        const isChecking = check.status === 'checking'
        const isPending = check.status === 'pending'
        const isAlive = check.status === 'alive'
        const isDead = check.status === 'dead'
        const statusLabel = isPending
          ? t('proxyStatus.pending')
          : isChecking
            ? t('proxyStatus.checking')
            : t(`proxyStatus.${check.status}`)

        return (
          <Box
            key={`${check.domain}-${check.url}`}
            sx={{
              p: 1.5,
              borderRadius: '16px',
              bgcolor: styles.bgcolor,
              animation: `${domainEnter} 0.32s ${MD3_EASING.emphasizedDecelerate} both`,
              animationDelay: staggerDelay(index),
              ...(isChecking
                ? {
                    boxShadow: `0 0 0 0 ${withThemeAlpha(theme, palette.info.main, 0.2)}`,
                    animation: `${domainEnter} 0.32s ${MD3_EASING.emphasizedDecelerate} both, domainPulse 1.8s ease-in-out infinite`,
                    animationDelay: `${staggerDelay(index)}, 0ms`,
                    '@keyframes domainPulse': {
                      '0%, 100%': {
                        boxShadow: `0 0 0 0 ${withThemeAlpha(theme, palette.info.main, 0)}`
                      },
                      '50%': {
                        boxShadow: `0 0 0 6px ${withThemeAlpha(theme, palette.info.main, 0.12)}`
                      }
                    }
                  }
                : {}),
              '@media (prefers-reduced-motion: reduce)': {
                animation: 'none'
              }
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  minWidth: 0,
                  color: isPending ? 'text.secondary' : 'text.primary'
                }}
                noWrap
              >
                {check.domain}
              </Typography>
              <Chip
                label={statusLabel}
                color={isAlive ? 'success' : isDead ? 'error' : isChecking ? 'info' : 'default'}
                size="small"
                icon={isChecking ? <CircularProgress size={12} color="inherit" /> : undefined}
                sx={{ flexShrink: 0, fontWeight: 700, border: 'none' }}
              />
            </Stack>

            <Stack spacing={0.35}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {t('proxyList.errorUrl')}:{' '}
                <Box component="span" sx={{ fontFamily: 'monospace', color: 'text.primary' }}>
                  {check.url}
                </Box>
              </Typography>

              {check.latencyMs !== undefined && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {t('proxyList.columns.latency')}: <LatencyText latencyMs={check.latencyMs} />
                </Typography>
              )}

              {check.error && (
                <Typography variant="caption" sx={{ display: 'block', color: 'error.main' }}>
                  {t('proxyList.errorMessage')}: {check.error}
                </Typography>
              )}

              {check.code && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {t('proxyList.errorCode')}:{' '}
                  <Box component="span" sx={{ fontFamily: 'monospace', color: 'text.primary' }}>
                    {check.code}
                  </Box>
                </Typography>
              )}
            </Stack>
          </Box>
        )
      })}
    </Stack>
  )
}

export default ProxyDomainResults
