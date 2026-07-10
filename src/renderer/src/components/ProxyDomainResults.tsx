import { Box, Chip, CircularProgress, Stack, Typography } from '@mui/material'
import { alpha, keyframes, useTheme, type Theme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import type { ProxyDomainCheckResult } from '../../../shared/types/proxy'

interface ProxyDomainResultsProps {
  domainChecks: ProxyDomainCheckResult[]
}

const domainEnter = keyframes`
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

const checkingPulse = keyframes`
  0%, 100% {
    box-shadow: 0 0 0 0 transparent;
  }
  50% {
    box-shadow: 0 0 0 4px rgba(92, 138, 255, 0.12);
  }
`

function getDomainStyles(
  status: ProxyDomainCheckResult['status'],
  theme: Theme
): { bgcolor: string; borderColor: string; accent: string } {
  if (status === 'alive') {
    return {
      bgcolor: alpha(theme.palette.success.main, theme.palette.mode === 'dark' ? 0.12 : 0.08),
      borderColor: alpha(theme.palette.success.main, 0.18),
      accent: theme.palette.success.main
    }
  }

  if (status === 'dead') {
    return {
      bgcolor: alpha(theme.palette.error.main, theme.palette.mode === 'dark' ? 0.12 : 0.08),
      borderColor: alpha(theme.palette.error.main, 0.18),
      accent: theme.palette.error.main
    }
  }

  if (status === 'checking') {
    return {
      bgcolor: alpha(theme.palette.info.main, theme.palette.mode === 'dark' ? 0.14 : 0.1),
      borderColor: alpha(theme.palette.info.main, 0.28),
      accent: theme.palette.info.main
    }
  }

  return {
    bgcolor: alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.06 : 0.04),
    borderColor: alpha(theme.palette.divider, 0.8),
    accent: theme.palette.text.secondary
  }
}

function ProxyDomainResults({ domainChecks }: ProxyDomainResultsProps): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()

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
              borderRadius: 2,
              bgcolor: styles.bgcolor,
              border: 1,
              borderColor: styles.borderColor,
              animation: `${domainEnter} 0.28s cubic-bezier(0.22, 1, 0.36, 1) both`,
              animationDelay: `${index * 40}ms`,
              ...(isChecking
                ? {
                    animation: `${domainEnter} 0.28s cubic-bezier(0.22, 1, 0.36, 1) both, ${checkingPulse} 1.6s ease-in-out infinite`,
                    animationDelay: `${index * 40}ms, 0ms`
                  }
                : {})
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
                variant="outlined"
                icon={isChecking ? <CircularProgress size={12} color="inherit" /> : undefined}
                sx={{ flexShrink: 0 }}
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
                  {t('proxyList.columns.latency')}:{' '}
                  <Box component="span" sx={{ color: 'success.main', fontWeight: 600 }}>
                    {t('proxyList.latencyMs', { value: check.latencyMs })}
                  </Box>
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
