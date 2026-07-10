import CheckIcon from '@mui/icons-material/Check'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import LinkIcon from '@mui/icons-material/Link'
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined'
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { Box, Button, Chip, CircularProgress, Stack, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { findProxyCountry } from '../../../shared/constants/proxy-countries'
import type { Proxy, ProxyAnonymityLevel } from '../../../shared/types/proxy'
import { formatDateTime } from '../../../shared/utils/datetime'
import { getProxyDomainChecks } from '../../../shared/utils/proxy-check-results'
import { buildProxyUrl, formatProxyAddress } from '../../../shared/utils/proxy-format'
import { elevationShadow, surfaceContainer } from '../theme'
import { getProxyColorStyles } from '../utils/proxy-color-styles'
import ContentSection from './ContentSection'
import CopyableField from './CopyableField'
import CountryFlag from './CountryFlag'
import LatencyText from './LatencyText'
import ProxyConnectivityResultCard from './ProxyConnectivityResult'
import ProxyDomainResults from './ProxyDomainResults'
import ProxyErrorPopover from './ProxyErrorPopover'
import ProxyIcon from './ProxyIcon'
import ProxyStatusChip from './ProxyStatusChip'

interface ProxyCardProps {
  proxy: Proxy
  isChecking: boolean
  isCheckingAll: boolean
  onCheck: () => void
  onEdit: () => void
  onDelete: () => void
}

interface ImportantField {
  label: string
  value: string
  displayValue?: string
  monospace?: boolean
  secret?: boolean
}

const metadataChipSx = {
  border: 'none',
  '& .MuiChip-label': {
    px: 1,
    py: 0.375
  }
} as const

function AnonymityLevelIcon({ level }: { level: ProxyAnonymityLevel }): React.JSX.Element {
  const iconSx = { fontSize: 16 }

  if (level === 'elite') {
    return <ShieldOutlinedIcon sx={iconSx} />
  }

  if (level === 'anonymous') {
    return <VisibilityOffOutlinedIcon sx={iconSx} />
  }

  return <VisibilityOutlinedIcon sx={iconSx} />
}

function ProxyCard({
  proxy,
  isChecking,
  isCheckingAll,
  onCheck,
  onEdit,
  onDelete
}: ProxyCardProps): React.JSX.Element {
  const { t, i18n } = useTranslation()
  const theme = useTheme()
  const [linkCopied, setLinkCopied] = useState(false)
  const [resultsExpanded, setResultsExpanded] = useState(false)

  useEffect(() => {
    if (isChecking) {
      setResultsExpanded(true)
    }
  }, [isChecking])

  const effectiveResultsExpanded = resultsExpanded || isChecking

  const proxyUrl = buildProxyUrl(proxy)
  const address = formatProxyAddress(proxy)
  const domainChecks = useMemo(() => getProxyDomainChecks(proxy), [proxy])
  const colorStyles = useMemo(() => getProxyColorStyles(theme, proxy.color), [theme, proxy.color])

  const connectionFields = useMemo(() => {
    const fields: ImportantField[] = [
      {
        label: t('proxyForm.host'),
        value: proxy.host,
        monospace: true
      },
      {
        label: t('proxyForm.port'),
        value: String(proxy.port),
        monospace: true
      }
    ]

    if (proxy.username) {
      fields.push({
        label: t('proxyList.columns.username'),
        value: proxy.username,
        monospace: true
      })
    }

    if (proxy.password) {
      fields.push({
        label: t('proxyList.columns.password'),
        value: proxy.password,
        monospace: true,
        secret: true
      })
    }

    if (proxy.countryCode) {
      const country = findProxyCountry(proxy.countryCode)
      fields.push({
        label: t('proxyList.columns.country'),
        value: proxy.countryCode,
        displayValue: country ? `${country.name} (${proxy.countryCode})` : proxy.countryCode,
        monospace: true
      })
    }

    if (proxy.city) {
      fields.push({
        label: t('proxyList.columns.city'),
        value: proxy.city
      })
    }

    if (proxy.anonymityLevel) {
      fields.push({
        label: t('proxyList.columns.anonymityLevel'),
        value: proxy.anonymityLevel,
        displayValue: t(`proxyAnonymity.${proxy.anonymityLevel}`)
      })
    }

    return fields
  }, [proxy, t])

  const resultsTitle = useMemo(() => {
    const connectLatencyMs = proxy.connectivity?.latencyMs

    return (
      <>
        {t('proxyList.sections.results')}
        {proxy.checkedAt ? ` · ${formatDateTime(proxy.checkedAt, i18n.language)}` : null}
        {connectLatencyMs !== undefined ? (
          <>
            {' · '}
            <LatencyText latencyMs={connectLatencyMs} />
          </>
        ) : null}
      </>
    )
  }, [proxy.checkedAt, proxy.connectivity?.latencyMs, t, i18n.language])

  const showResults = isChecking || Boolean(proxy.checkedAt)

  const handleCopyLink = async (): Promise<void> => {
    await navigator.clipboard.writeText(proxyUrl)
    setLinkCopied(true)
    window.setTimeout(() => setLinkCopied(false), 1500)
  }

  const renderFields = (fields: ImportantField[]): React.JSX.Element => (
    <Stack spacing={1}>
      {fields.map((field) => (
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
  )

  return (
    <Box
      sx={{
        borderRadius: 3,
        bgcolor: 'background.paper',
        boxShadow: elevationShadow(theme, 1),
        overflow: 'hidden'
      }}
    >
      <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start', mb: 2.5 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
              borderRadius: 2.5,
              flexShrink: 0,
              bgcolor: colorStyles.background,
              color: colorStyles.main,
              ...(isChecking
                ? {
                    animation: 'iconPulse 1.6s ease-in-out infinite',
                    '@keyframes iconPulse': {
                      '0%, 100%': {
                        boxShadow: `0 0 0 0 ${colorStyles.ring}`
                      },
                      '50%': { boxShadow: `0 0 0 8px ${alpha(colorStyles.main, 0)}` }
                    }
                  }
                : {})
            }}
          >
            <ProxyIcon iconId={proxy.icon} fontSize="small" />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}
            >
              <Typography
                variant="h6"
                sx={{ fontSize: '1.05rem', fontWeight: 600, lineHeight: 1.3 }}
                noWrap
              >
                {proxy.label || proxy.host}
              </Typography>
              <ProxyStatusChip status={proxy.status} />
            </Stack>

            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <Chip
                label={proxy.protocol.toUpperCase()}
                size="small"
                sx={{
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  bgcolor: surfaceContainer(theme, 'high'),
                  color: 'primary.main',
                  border: 'none'
                }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                {address}
              </Typography>
            </Stack>

            {(proxy.countryCode || proxy.city || proxy.anonymityLevel) && (
              <Stack direction="row" spacing={0.75} sx={{ mt: 1, flexWrap: 'wrap' }}>
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
                    sx={metadataChipSx}
                  />
                )}
                {proxy.city && (
                  <Chip
                    size="small"
                    label={
                      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                        <LocationOnOutlinedIcon sx={{ fontSize: 16 }} />
                        <span>{proxy.city}</span>
                      </Stack>
                    }
                    sx={metadataChipSx}
                  />
                )}
                {proxy.anonymityLevel && (
                  <Chip
                    size="small"
                    label={
                      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                        <AnonymityLevelIcon level={proxy.anonymityLevel} />
                        <span>{t(`proxyAnonymity.${proxy.anonymityLevel}`)}</span>
                      </Stack>
                    }
                    color={
                      proxy.anonymityLevel === 'elite'
                        ? 'success'
                        : proxy.anonymityLevel === 'anonymous'
                          ? 'info'
                          : 'warning'
                    }
                    sx={metadataChipSx}
                  />
                )}
              </Stack>
            )}
          </Box>
        </Stack>

        <Stack spacing={2}>
          <ContentSection
            nested
            collapsible
            defaultExpanded={false}
            icon={<DnsOutlinedIcon fontSize="small" />}
            title={t('proxyList.sections.connection')}
            description={t('proxyList.sections.connectionDescription')}
          >
            {renderFields(connectionFields)}
          </ContentSection>

          {showResults && (
            <ContentSection
              nested
              collapsible
              expanded={effectiveResultsExpanded}
              onExpandedChange={setResultsExpanded}
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
        </Stack>

        {proxy.error && domainChecks.length === 0 && (
          <Box sx={{ mt: 2 }}>
            <ProxyErrorPopover error={proxy.error} errorDetails={proxy.errorDetails} />
          </Box>
        )}
      </Box>

      <Box
        sx={{
          px: { xs: 2.5, sm: 3 },
          pb: { xs: 2.5, sm: 3 },
          pt: 0,
          display: 'flex',
          gap: 1,
          flexWrap: 'wrap',
          justifyContent: 'flex-end'
        }}
      >
        <Button
          size="small"
          variant="outlined"
          color="primary"
          startIcon={linkCopied ? <CheckIcon /> : <LinkIcon />}
          onClick={() => void handleCopyLink()}
        >
          {linkCopied ? t('common.copied') : t('proxyList.actions.copyLink')}
        </Button>
        <Button
          size="small"
          variant="contained"
          color="primary"
          startIcon={
            isChecking ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />
          }
          onClick={onCheck}
          disabled={isChecking || isCheckingAll}
        >
          {t('proxyList.actions.check')}
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<EditOutlinedIcon />}
          onClick={onEdit}
          disabled={isCheckingAll}
        >
          {t('proxyList.actions.edit')}
        </Button>
        <Button
          size="small"
          variant="outlined"
          color="error"
          startIcon={<DeleteOutlinedIcon />}
          onClick={onDelete}
          disabled={isCheckingAll}
        >
          {t('proxyList.actions.delete')}
        </Button>
      </Box>
    </Box>
  )
}

export default ProxyCard
