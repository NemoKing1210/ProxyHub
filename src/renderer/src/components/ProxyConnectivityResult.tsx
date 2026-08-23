import { Box, Chip, CircularProgress, Stack, Typography } from '@mui/material'
import { keyframes, useTheme, type Theme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import type { ProxyConnectivityResult } from '@shared/types/proxy'
import { getPalette, MD3_EASING, withThemeAlpha } from '../theme'

interface ProxyConnectivityResultProps {
  connectivity: ProxyConnectivityResult
}

const connectivityEnter = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`

function getConnectivityStyles(
  status: ProxyConnectivityResult['status'],
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

function ProxyConnectivityResultCard({
  connectivity
}: ProxyConnectivityResultProps): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const palette = getPalette(theme)
  const styles = getConnectivityStyles(connectivity.status, theme)
  const isChecking = connectivity.status === 'checking'
  const isPending = connectivity.status === 'pending'
  const isAlive = connectivity.status === 'alive'
  const isDead = connectivity.status === 'dead'
  const statusLabel = isPending
    ? t('proxyStatus.pending')
    : isChecking
      ? t('proxyStatus.checking')
      : t(`proxyStatus.${connectivity.status}`)
  const detailText = isAlive
    ? connectivity.externalIp
    : isDead
      ? (connectivity.error ?? t('proxyList.connectivity.failed'))
      : null

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: '16px',
        bgcolor: styles.bgcolor,
        animation: `${connectivityEnter} 0.32s ${MD3_EASING.emphasizedDecelerate} both`,
        ...(isChecking
          ? {
              boxShadow: `0 0 0 0 ${withThemeAlpha(theme, palette.info.main, 0.2)}`,
              animation: `${connectivityEnter} 0.32s ${MD3_EASING.emphasizedDecelerate} both, connectivityPulse 1.8s ease-in-out infinite`,
              '@keyframes connectivityPulse': {
                '0%, 100%': { boxShadow: `0 0 0 0 ${withThemeAlpha(theme, palette.info.main, 0)}` },
                '50%': { boxShadow: `0 0 0 6px ${withThemeAlpha(theme, palette.info.main, 0.12)}` }
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
        sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}
      >
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            minWidth: 0,
            color: isPending ? 'text.secondary' : 'text.primary'
          }}
        >
          {t('proxyList.connectivity.title')}
        </Typography>
        <Chip
          label={statusLabel}
          color={isAlive ? 'success' : isDead ? 'error' : isChecking ? 'info' : 'default'}
          size="small"
          icon={isChecking ? <CircularProgress size={12} color="inherit" /> : undefined}
          sx={{ flexShrink: 0, fontWeight: 700, border: 'none' }}
        />
      </Stack>

      {detailText && (
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mt: 0.75,
            color: isDead ? 'error.main' : 'text.secondary',
            fontWeight: isAlive ? 600 : 500,
            wordBreak: 'break-word'
          }}
        >
          {isAlive ? (
            <>
              {t('proxyList.columns.externalIp')}:{' '}
              <Box component="span" sx={{ fontFamily: 'monospace', color: 'text.primary' }}>
                {detailText}
              </Box>
            </>
          ) : (
            detailText
          )}
        </Typography>
      )}
    </Box>
  )
}

export default ProxyConnectivityResultCard
