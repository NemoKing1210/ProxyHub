import CheckIcon from '@mui/icons-material/Check'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import LinkIcon from '@mui/icons-material/Link'
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined'
import StarIcon from '@mui/icons-material/Star'
import StarBorderOutlinedIcon from '@mui/icons-material/StarBorderOutlined'
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { Alert, Box, Button, Chip, CircularProgress, FormControlLabel, IconButton, Snackbar, Stack, Switch, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { findProxyCountry } from '../../../shared/constants/proxy-countries'
import type { Proxy, ProxyAnonymityLevel, ProxyIconId } from '../../../shared/types/proxy'
import { formatDateTime } from '../../../shared/utils/datetime'
import { isProxyEnabled } from '../../../shared/utils/proxy-enabled'
import { getProxyDomainChecks } from '../../../shared/utils/proxy-check-results'
import { buildProxyUrl, formatProxyAddress } from '../../../shared/utils/proxy-format'
import { elevationShadow, surfaceContainer } from '../theme'
import { getProxyColorStyles } from '../utils/proxy-color-styles'
import ProxyCardAvatar from './ProxyCardAvatar'
import ContentSection from './ContentSection'
import CopyableField from './CopyableField'
import CountryFlag from './CountryFlag'
import LatencyText from './LatencyText'
import ProxyConnectivityResultCard from './ProxyConnectivityResult'
import ProxyDomainResults from './ProxyDomainResults'
import ProxyErrorPopover from './ProxyErrorPopover'
import ProxyIconPickerPopover from './ProxyIconPickerPopover'
import ProxyStatusChip from './ProxyStatusChip'

interface ProxyCardProps {
  proxy: Proxy
  isChecking: boolean
  isCheckingAll: boolean
  onCheck: () => void
  onEdit: () => void
  onDelete: () => void
  onIconChange: (iconId: ProxyIconId | undefined) => void
  onToggleFavorite: () => void
  onToggleEnabled: () => void
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
  cursor: 'pointer',
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
  onDelete,
  onIconChange,
  onToggleFavorite,
  onToggleEnabled
}: ProxyCardProps): React.JSX.Element {
  const { t, i18n } = useTranslation()
  const theme = useTheme()
  const [linkCopied, setLinkCopied] = useState(false)
  const [copyToastOpen, setCopyToastOpen] = useState(false)
  const [resultsExpanded, setResultsExpanded] = useState(false)
  const [iconPickerAnchor, setIconPickerAnchor] = useState<HTMLElement | null>(null)
  const enabled = isProxyEnabled(proxy)

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

  const handleCopy = async (text: string): Promise<void> => {
    await navigator.clipboard.writeText(text)
    setCopyToastOpen(true)
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
        overflow: 'hidden',
        opacity: enabled ? 1 : 0.62,
        transition: 'opacity 160ms ease'
      }}
    >
      <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start', mb: 2.5 }}>
          <IconButton
            onClick={(event) => setIconPickerAnchor(event.currentTarget)}
            aria-label={t('proxyList.actions.changeIcon')}
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
              transition: 'background-color 160ms ease, transform 160ms ease',
              '&:hover': {
                bgcolor: alpha(colorStyles.main, theme.palette.mode === 'dark' ? 0.32 : 0.22),
                color: colorStyles.main
              },
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
            <ProxyCardAvatar icon={proxy.icon} countryCode={proxy.countryCode} flagSize={22} fontSize="small" />
          </IconButton>

          <ProxyIconPickerPopover
            anchorEl={iconPickerAnchor}
            open={Boolean(iconPickerAnchor)}
            value={proxy.icon}
            countryCode={proxy.countryCode}
            onClose={() => setIconPickerAnchor(null)}
            onSelect={(iconId) => {
              onIconChange(iconId)
              setIconPickerAnchor(null)
            }}
          />

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}
            >
              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', minWidth: 0, flex: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={enabled}
                      onChange={onToggleEnabled}
                      size="small"
                      disabled={isCheckingAll}
                    />
                  }
                  label=""
                  aria-label={
                    enabled
                      ? t('proxyList.actions.disableProxy')
                      : t('proxyList.actions.enableProxy')
                  }
                  sx={{ m: 0, flexShrink: 0 }}
                />
                <IconButton
                  size="small"
                  onClick={onToggleFavorite}
                  aria-label={
                    proxy.isFavorite
                      ? t('proxyList.actions.removeFromFavorites')
                      : t('proxyList.actions.addToFavorites')
                  }
                  sx={{
                    flexShrink: 0,
                    color: proxy.isFavorite ? 'warning.main' : 'text.disabled',
                    '&:hover': {
                      color: proxy.isFavorite ? 'warning.dark' : 'warning.main'
                    }
                  }}
                >
                  {proxy.isFavorite ? (
                    <StarIcon fontSize="small" />
                  ) : (
                    <StarBorderOutlinedIcon fontSize="small" />
                  )}
                </IconButton>
                <Typography
                  variant="h6"
                  onClick={() => void handleCopy(proxy.label?.trim() || proxy.host)}
                  sx={{
                    fontSize: '1.05rem',
                    fontWeight: 600,
                    lineHeight: 1.3,
                    cursor: 'pointer',
                    minWidth: 0
                  }}
                  noWrap
                >
                  {proxy.label || proxy.host}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', flexShrink: 0 }}>
                {!enabled && (
                  <Chip
                    label={t('proxyList.disabled')}
                    size="small"
                    sx={{ height: 24, fontWeight: 700, border: 'none' }}
                  />
                )}
                <ProxyStatusChip status={proxy.status} />
              </Stack>
            </Stack>

            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <Chip
                label={proxy.protocol.toUpperCase()}
                size="small"
                onClick={() => void handleCopy(proxy.protocol)}
                sx={{
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  bgcolor: surfaceContainer(theme, 'high'),
                  color: 'primary.main',
                  border: 'none',
                  cursor: 'pointer'
                }}
              />
              <Typography
                variant="body2"
                color="text.secondary"
                onClick={() => void handleCopy(address)}
                sx={{ fontFamily: 'monospace', cursor: 'pointer' }}
              >
                {address}
              </Typography>
            </Stack>

            {(proxy.countryCode || proxy.city || proxy.anonymityLevel) && (
              <Stack direction="row" spacing={0.75} sx={{ mt: 1, flexWrap: 'wrap' }}>
                {proxy.countryCode && (
                  <Chip
                    size="small"
                    onClick={() =>
                      void handleCopy(
                        findProxyCountry(proxy.countryCode!)?.name ?? proxy.countryCode!
                      )
                    }
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
                    onClick={() => void handleCopy(proxy.city!)}
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
                    onClick={() => void handleCopy(proxy.anonymityLevel!)}
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

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ alignItems: 'stretch' }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
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
          </Box>

          {showResults && (
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <ContentSection
                nested
                collapsible
                expanded={resultsExpanded}
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
            </Box>
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

      <Snackbar
        open={copyToastOpen}
        autoHideDuration={2000}
        onClose={() => setCopyToastOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" onClose={() => setCopyToastOpen(false)}>
          {t('common.copied')}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default ProxyCard
