import StarIcon from '@mui/icons-material/Star'
import { Box, Chip, Paper, Stack, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { useMemo } from 'react'
import type { Proxy } from '../../../shared/types/proxy'
import { formatProxyAddress } from '../../../shared/utils/proxy-format'
import { elevationShadow, surfaceContainer, withThemeAlpha } from '../theme'
import { getProxyColorStyles } from '../utils/proxy-color-styles'
import { getProxyProtocolStyles } from '../utils/proxy-protocol-styles'
import ProxyCardAvatar from './ProxyCardAvatar'
import ProxyStatusChip from './ProxyStatusChip'

interface ProxyCardDragOverlayProps {
  proxy: Proxy
}

function ProxyCardDragOverlay({ proxy }: ProxyCardDragOverlayProps): React.JSX.Element {
  const theme = useTheme()
  const title = proxy.label?.trim() || formatProxyAddress(proxy)
  const subtitle = proxy.label?.trim() ? formatProxyAddress(proxy) : null
  const colorStyles = useMemo(() => getProxyColorStyles(theme, proxy.color), [theme, proxy.color])
  const protocolStyles = useMemo(
    () => getProxyProtocolStyles(theme, proxy.protocol),
    [theme, proxy.protocol]
  )

  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 1.25,
        minWidth: 280,
        maxWidth: 420,
        borderRadius: 3,
        cursor: 'grabbing',
        bgcolor: withThemeAlpha(theme, surfaceContainer(theme, 'default'), 0.94),
        backdropFilter: 'blur(14px) saturate(1.2)',
        WebkitBackdropFilter: 'blur(14px) saturate(1.2)',
        boxShadow: `${elevationShadow(theme, 3)}, 0 14px 36px ${alpha(theme.palette.primary.main, 0.2)}`,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.28)}`,
        transform: 'rotate(-1.25deg) scale(1.03)',
        transition: 'box-shadow 180ms ease, transform 180ms ease'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          borderRadius: 2.5,
          flexShrink: 0,
          bgcolor: colorStyles.background,
          color: colorStyles.main,
          boxShadow: `inset 0 0 0 1px ${colorStyles.ring}`
        }}
      >
        <ProxyCardAvatar
          icon={proxy.icon}
          countryCode={proxy.countryCode}
          flagSize={20}
          fontSize="small"
        />
      </Box>

      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', minWidth: 0, mb: 0.25 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 700,
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {title}
          </Typography>
          {proxy.isFavorite ? <StarIcon sx={{ fontSize: 16, color: 'warning.main', flexShrink: 0 }} /> : null}
        </Stack>

        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', minWidth: 0 }}>
          <Chip
            label={proxy.protocol.toUpperCase()}
            size="small"
            sx={{
              height: 22,
              fontWeight: 700,
              letterSpacing: 0.4,
              bgcolor: protocolStyles.background,
              color: protocolStyles.main,
              border: 'none',
              flexShrink: 0
            }}
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              fontFamily: 'monospace',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {subtitle ?? title}
          </Typography>
        </Stack>
      </Box>

      <Box sx={{ flexShrink: 0 }}>
        <ProxyStatusChip status={proxy.status} />
      </Box>
    </Paper>
  )
}

export default ProxyCardDragOverlay
