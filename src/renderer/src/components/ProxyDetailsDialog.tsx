import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined'
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { findProxyCountry } from '@shared/constants/proxy-countries'
import type { Proxy, ProxyAnonymityLevel } from '@shared/types/proxy'
import { formatDateTime } from '@shared/utils/datetime'
import { getProxyDomainChecks } from '@shared/utils/proxy-check-results'
import { formatProxyAddress } from '@shared/utils/proxy-format'
import { getProxyColorStyles } from '../utils/proxy-color-styles'
import { getProxyProtocolStyles } from '../utils/proxy-protocol-styles'
import ContentSection from './ContentSection'
import CopyableField from './CopyableField'
import CountryFlag from './CountryFlag'
import LatencyText from './LatencyText'
import ProxyCardAvatar from './ProxyCardAvatar'
import ProxyConnectivityResultCard from './ProxyConnectivityResult'
import ProxyDomainResults from './ProxyDomainResults'
import ProxyErrorPopover from './ProxyErrorPopover'
import ProxyShareDialog from './ProxyShareDialog'
import ProxyStatusChip from './ProxyStatusChip'

interface ProxyDetailsDialogProps {
  open: boolean
  proxy: Proxy | undefined
  isChecking: boolean
  onClose: () => void
  onCheck: () => void
}

interface DetailField {
  label: string
  value: string
  displayValue?: string
  monospace?: boolean
  secret?: boolean
}

function ProxyDetailsDialog({
  open,
  proxy,
  isChecking,
  onClose,
  onCheck
}: ProxyDetailsDialogProps): React.JSX.Element | null {
  const { t, i18n } = useTranslation()
  const theme = useTheme()
  const [shareOpen, setShareOpen] = useState(false)

  const domainChecks = useMemo(() => (proxy ? getProxyDomainChecks(proxy) : []), [proxy])
  const colorStyles = useMemo(
    () => (proxy ? getProxyColorStyles(theme, proxy.color) : null),
    [proxy, theme]
  )
  const protocolStyles = useMemo(
    () => (proxy ? getProxyProtocolStyles(theme, proxy.protocol) : null),
    [proxy, theme]
  )

  if (!proxy) {
    return null
  }

  const address = formatProxyAddress(proxy)
  const connectionFields: DetailField[] = [
    { label: t('proxyForm.host'), value: proxy.host, monospace: true },
    { label: t('proxyForm.port'), value: String(proxy.port), monospace: true }
  ]

  if (proxy.secret) {
    connectionFields.push({
      label: t('proxyList.columns.secret'),
      value: proxy.secret,
      monospace: true,
      secret: true
    })
  }

  if (proxy.username) {
    connectionFields.push({
      label: t('proxyList.columns.username'),
      value: proxy.username,
      monospace: true
    })
  }

  if (proxy.password) {
    connectionFields.push({
      label: t('proxyList.columns.password'),
      value: proxy.password,
      monospace: true,
      secret: true
    })
  }

  if (proxy.countryCode) {
    const country = findProxyCountry(proxy.countryCode)
    connectionFields.push({
      label: t('proxyList.columns.country'),
      value: proxy.countryCode,
      displayValue: country ? `${country.name} (${proxy.countryCode})` : proxy.countryCode,
      monospace: true
    })
  }

  if (proxy.city) {
    connectionFields.push({
      label: t('proxyList.columns.city'),
      value: proxy.city
    })
  }

  if (proxy.anonymityLevel) {
    connectionFields.push({
      label: t('proxyList.columns.anonymityLevel'),
      value: proxy.anonymityLevel,
      displayValue: t(`proxyAnonymity.${proxy.anonymityLevel as ProxyAnonymityLevel}`)
    })
  }

  const resultsTitle = (
    <>
      {t('proxyList.sections.results')}
      {proxy.checkedAt ? ` · ${formatDateTime(proxy.checkedAt, i18n.language)}` : null}
      {proxy.connectivity?.latencyMs !== undefined ? (
        <>
          {' · '}
          <LatencyText latencyMs={proxy.connectivity.latencyMs} />
        </>
      ) : null}
    </>
  )

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" scroll="paper">
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '16px',
                display: 'grid',
                placeItems: 'center',
                bgcolor: colorStyles?.background,
                color: colorStyles?.main,
                flexShrink: 0
              }}
            >
              <ProxyCardAvatar
                icon={proxy.icon}
                countryCode={proxy.countryCode}
                flagSize={22}
                fontSize="small"
              />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.25 }}>
                {proxy.label?.trim() || proxy.host}
              </Typography>
              <Stack
                direction="row"
                spacing={0.75}
                sx={{ mt: 0.75, flexWrap: 'wrap', alignItems: 'center' }}
              >
                <ProxyStatusChip status={isChecking ? 'checking' : proxy.status} />
                <Chip
                  label={proxy.protocol.toUpperCase()}
                  size="small"
                  sx={{
                    height: 24,
                    fontWeight: 700,
                    bgcolor: protocolStyles?.background,
                    color: protocolStyles?.main
                  }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontFamily: 'monospace' }}
                >
                  {address}
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2}>
            {(proxy.countryCode || proxy.city) && (
              <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap' }}>
                {proxy.countryCode && (
                  <Chip
                    size="small"
                    label={
                      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                        <CountryFlag countryCode={proxy.countryCode} size={16} />
                        <span>
                          {findProxyCountry(proxy.countryCode)?.name ?? proxy.countryCode}
                        </span>
                      </Stack>
                    }
                  />
                )}
                {proxy.city && <Chip size="small" label={proxy.city} />}
              </Stack>
            )}

            <ContentSection
              nested
              defaultExpanded
              icon={<DnsOutlinedIcon fontSize="small" />}
              title={t('proxyList.sections.connection')}
              description={t('proxyList.sections.connectionDescription')}
            >
              <Stack spacing={1}>
                {connectionFields.map((field) => (
                  <CopyableField
                    key={field.label}
                    label={field.label}
                    value={field.value}
                    displayValue={field.displayValue}
                    monospace={field.monospace}
                    secret={field.secret}
                  />
                ))}
              </Stack>
            </ContentSection>

            {(isChecking || proxy.checkedAt) && (
              <ContentSection
                nested
                defaultExpanded
                icon={<SpeedOutlinedIcon fontSize="small" />}
                title={resultsTitle}
                description={t('proxyList.sections.resultsDescription')}
              >
                <Stack spacing={2}>
                  {proxy.connectivity && (
                    <ProxyConnectivityResultCard connectivity={proxy.connectivity} />
                  )}
                  {domainChecks.length > 0 && <ProxyDomainResults domainChecks={domainChecks} />}
                </Stack>
              </ContentSection>
            )}

            {proxy.error && domainChecks.length === 0 && (
              <ProxyErrorPopover error={proxy.error} errorDetails={proxy.errorDetails} />
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
          <Button onClick={onClose}>{t('common.close')}</Button>
          <Box sx={{ flex: 1 }} />
          <Button
            variant="outlined"
            startIcon={<ShareOutlinedIcon />}
            onClick={() => setShareOpen(true)}
          >
            {t('proxyList.actions.share')}
          </Button>
          <Button
            variant="contained"
            startIcon={
              isChecking ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />
            }
            onClick={onCheck}
            disabled={isChecking}
          >
            {t('proxyList.actions.check')}
          </Button>
        </DialogActions>
      </Dialog>

      <ProxyShareDialog open={shareOpen} proxy={proxy} onClose={() => setShareOpen(false)} />
    </>
  )
}

export default ProxyDetailsDialog
