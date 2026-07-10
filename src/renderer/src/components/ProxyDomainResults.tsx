import { Box, Chip, Stack, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import type { ProxyDomainCheckResult } from '../../../shared/types/proxy'

interface ProxyDomainResultsProps {
  domainChecks: ProxyDomainCheckResult[]
}

function ProxyDomainResults({ domainChecks }: ProxyDomainResultsProps): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()

  return (
    <Stack spacing={1}>
      {domainChecks.map((check) => {
        const isAlive = check.status === 'alive'

        return (
          <Box
            key={`${check.domain}-${check.url}`}
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: alpha(
                isAlive ? theme.palette.success.main : theme.palette.error.main,
                theme.palette.mode === 'dark' ? 0.12 : 0.08
              ),
              border: 1,
              borderColor: alpha(
                isAlive ? theme.palette.success.main : theme.palette.error.main,
                0.18
              )
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}
            >
              <Typography
                variant="body2"
                sx={{ fontFamily: 'monospace', fontWeight: 600, minWidth: 0 }}
                noWrap
              >
                {check.domain}
              </Typography>
              <Chip
                label={t(`proxyStatus.${check.status}`)}
                color={isAlive ? 'success' : 'error'}
                size="small"
                variant="outlined"
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
