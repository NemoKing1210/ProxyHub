import { Box, Button, Checkbox, Chip, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import type { ProviderProxy } from '@shared/types/provider'
import { formatProxyAddress } from '@shared/utils/proxy-format'
import CountryFlag from '../ui/CountryFlag'
import LatencyText from '../ui/LatencyText'
import ProxyStatusChip from '../proxy/ProxyStatusChip'
import { elevationShadow, getPalette, surfaceContainer, withThemeAlpha } from '../../theme'

interface ProviderProxyRowProps {
  proxy: ProviderProxy
  selected: boolean
  isChecking: boolean
  listRadius?: string
  onToggleSelect: () => void
  onCheck: () => void
  onAdd: () => void
}

function ProviderProxyRow({
  proxy,
  selected,
  isChecking,
  listRadius,
  onToggleSelect,
  onCheck,
  onAdd
}: ProviderProxyRowProps): React.JSX.Element {
  const theme = useTheme()
  const palette = getPalette(theme)
  const { t } = useTranslation()

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        p: 1.5,
        borderRadius: listRadius ?? '12px',
        bgcolor: surfaceContainer(theme, 'high'),
        border: `1px solid ${withThemeAlpha(theme, palette.primary.main, selected ? 0.22 : 0.1)}`,
        boxShadow: elevationShadow(theme, 1),
        opacity: proxy.status === 'dead' ? 0.88 : 1
      }}
    >
      <Checkbox checked={selected} onChange={onToggleSelect} size="small" sx={{ p: 0.5 }} />

      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, fontFamily: 'monospace', fontSize: 13 }}
          >
            {formatProxyAddress(proxy)}
          </Typography>
          <Chip label={proxy.protocol} size="small" sx={{ height: 20, fontSize: 11 }} />
          {proxy.countryCode && <CountryFlag countryCode={proxy.countryCode} />}
          {proxy.providerMeta?.anonymity && (
            <Chip
              label={proxy.providerMeta.anonymity}
              size="small"
              variant="outlined"
              sx={{ height: 20, fontSize: 11 }}
            />
          )}
        </Box>
        <Stack direction="row" spacing={1} sx={{ mt: 0.5, alignItems: 'center' }}>
          <ProxyStatusChip status={proxy.status} />
          {proxy.latencyMs !== undefined && (
            <LatencyText latencyMs={proxy.latencyMs} sx={{ fontSize: 12 }} />
          )}
          {proxy.error && (
            <Typography variant="caption" color="error" noWrap sx={{ maxWidth: 220 }}>
              {proxy.error}
            </Typography>
          )}
        </Stack>
      </Box>

      <Stack direction="row" spacing={0.75} sx={{ flexShrink: 0 }}>
        <Button size="small" variant="outlined" onClick={onCheck} disabled={isChecking}>
          {t('providers.detail.check', { defaultValue: 'Check' })}
        </Button>
        <Button size="small" variant="contained" onClick={onAdd}>
          {t('providers.detail.add', { defaultValue: 'Add' })}
        </Button>
      </Stack>
    </Box>
  )
}

export default ProviderProxyRow
