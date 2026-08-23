import CheckIcon from '@mui/icons-material/Check'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import FolderOffOutlinedIcon from '@mui/icons-material/FolderOffOutlined'
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined'
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined'
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined'
import StarIcon from '@mui/icons-material/Star'
import StarBorderOutlinedIcon from '@mui/icons-material/StarBorderOutlined'
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined'
import ToggleOffOutlinedIcon from '@mui/icons-material/ToggleOffOutlined'
import ToggleOnOutlinedIcon from '@mui/icons-material/ToggleOnOutlined'
import UnfoldLessOutlinedIcon from '@mui/icons-material/UnfoldLessOutlined'
import UnfoldMoreOutlinedIcon from '@mui/icons-material/UnfoldMoreOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  FormControlLabel,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Snackbar,
  Stack,
  Switch,
  Typography
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { memo, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { findProxyCountry } from '@shared/constants/proxy-countries'
import type { Proxy, ProxyAnonymityLevel, ProxyIconId } from '@shared/types/proxy'
import type { ProxyGroup } from '@shared/types/proxy-group'
import type { ProxyCardViewMode } from '@shared/types/settings'
import { formatDateTime } from '@shared/utils/datetime'
import { isProxyEnabled } from '@shared/utils/proxy-enabled'
import { getProxyDomainChecks } from '@shared/utils/proxy-check-results'
import { buildProxyUrl, formatProxyAddress } from '@shared/utils/proxy-format'
import { elevationShadow, surfaceContainer, surfaceTint } from '../../theme'
import { getProxyDisplayLatency } from '../../lib/filter-proxies'
import { getProxyColorStyles } from '../../lib/proxy-color-styles'
import { getProxyProtocolStyles } from '../../lib/proxy-protocol-styles'
import ProxyCardAvatar from './ProxyCardAvatar'
import ContentSection from '../ui/ContentSection'
import CopyableField from '../ui/CopyableField'
import CountryFlag from '../ui/CountryFlag'
import LatencyText from '../ui/LatencyText'
import ProxyConnectivityResultCard from './ProxyConnectivityResult'
import ProxyDomainResults from './ProxyDomainResults'
import ProxyErrorPopover from './ProxyErrorPopover'
import ProxyGroupAvatar from '../group/ProxyGroupAvatar'
import ProxyIconPickerPopover from './ProxyIconPickerPopover'
import ProxyShareDialog from '../share/ProxyShareDialog'
import ProxyStatusChip from './ProxyStatusChip'

interface ProxyCardProps {
  proxy: Proxy
  groups?: ProxyGroup[]
  variant?: ProxyCardViewMode
  isChecking: boolean
  isCheckingAll: boolean
  dragHandle?: React.ReactNode
  listRadius?: string
  onCheck: () => void
  onEdit: () => void
  onDelete: () => void
  onIconChange: (iconId: ProxyIconId | undefined) => void
  onToggleFavorite: () => void
  onToggleEnabled: () => void
  onGroupChange?: (groupId: string | undefined) => void
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

const GROUP_MENU_AVATAR_SIZE = 24
const GROUP_MENU_ICON_SIZE = 14
const groupMenuListItemIconSx = { minWidth: 36, mr: 0.5 } as const

interface ContextMenuPosition {
  top: number
  left: number
}

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
  groups = [],
  variant = 'standard',
  isChecking,
  isCheckingAll,
  dragHandle,
  listRadius,
  onCheck,
  onEdit,
  onDelete,
  onIconChange,
  onToggleFavorite,
  onToggleEnabled,
  onGroupChange
}: ProxyCardProps): React.JSX.Element {
  const { t, i18n } = useTranslation()
  const theme = useTheme()
  const [copyToastOpen, setCopyToastOpen] = useState(false)
  const [resultsExpanded, setResultsExpanded] = useState(false)
  const [cardExpanded, setCardExpanded] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [iconPickerAnchor, setIconPickerAnchor] = useState<HTMLElement | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(null)
  const [groupMenuAnchor, setGroupMenuAnchor] = useState<HTMLElement | null>(null)
  const iconButtonRef = useRef<HTMLButtonElement>(null)
  const enabled = isProxyEnabled(proxy)
  const sortedGroups = useMemo(
    () =>
      [...groups].sort((left, right) =>
        left.name.localeCompare(right.name, undefined, { sensitivity: 'base' })
      ),
    [groups]
  )
  const currentGroup = useMemo(
    () => sortedGroups.find((group) => group.id === proxy.groupId),
    [sortedGroups, proxy.groupId]
  )

  const address = formatProxyAddress(proxy)
  const proxyUrl = useMemo(() => buildProxyUrl(proxy), [proxy])
  const domainChecks = useMemo(() => getProxyDomainChecks(proxy), [proxy])
  const colorStyles = useMemo(() => getProxyColorStyles(theme, proxy.color), [theme, proxy.color])
  const protocolStyles = useMemo(
    () => getProxyProtocolStyles(theme, proxy.protocol),
    [theme, proxy.protocol]
  )

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

    if (proxy.secret) {
      fields.push({
        label: t('proxyList.columns.secret'),
        value: proxy.secret,
        monospace: true,
        secret: true
      })
    }

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
  const isCompact = variant === 'compact'
  const showDetails = !isCompact || cardExpanded
  const displayLatency = useMemo(() => getProxyDisplayLatency(proxy), [proxy])

  const stopPropagation = (event: React.SyntheticEvent): void => {
    event.stopPropagation()
  }

  const toggleCardExpanded = (): void => {
    if (!isCompact) return
    setCardExpanded((value) => !value)
  }

  const handleHeaderKeyDown = (event: React.KeyboardEvent): void => {
    if (!isCompact) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      toggleCardExpanded()
    }
  }

  const handleCopy = async (text: string): Promise<void> => {
    await navigator.clipboard.writeText(text)
    setCopyToastOpen(true)
  }

  const closeContextMenu = (): void => {
    setContextMenu(null)
    setGroupMenuAnchor(null)
  }

  const handleContextMenu = (event: React.MouseEvent): void => {
    event.preventDefault()
    event.stopPropagation()
    setContextMenu({ top: event.clientY, left: event.clientX })
  }

  const runContextAction = (action: () => void): void => {
    closeContextMenu()
    action()
  }

  const runContextCopy = (text: string): void => {
    closeContextMenu()
    void handleCopy(text)
  }

  const openIconPickerFromMenu = (): void => {
    closeContextMenu()
    if (iconButtonRef.current) {
      setIconPickerAnchor(iconButtonRef.current)
    }
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

  const detailsContent = (
    <>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: 'stretch', mt: isCompact ? 2 : 0 }}
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
    </>
  )

  const actionsContent = (
    <Box
      sx={{
        px: { xs: 2.5, sm: 3 },
        pb: { xs: isCompact ? 2 : 2.5, sm: isCompact ? 2 : 3 },
        pt: isCompact ? 2 : 0,
        display: 'flex',
        gap: 1,
        flexWrap: 'wrap',
        justifyContent: 'flex-end'
      }}
    >
      <Button
        size="small"
        variant="outlined"
        startIcon={<ShareOutlinedIcon />}
        onClick={() => setShareOpen(true)}
      >
        {t('proxyList.actions.share')}
      </Button>
      <Button
        size="small"
        variant="contained"
        color="primary"
        startIcon={isChecking ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
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
  )

  return (
    <Box
      onContextMenu={handleContextMenu}
      sx={{
        borderRadius: listRadius ?? '16px',
        bgcolor: surfaceContainer(theme, 'lowest'),
        boxShadow: `${elevationShadow(theme, 1)}, inset 0 0 0 1px ${surfaceTint(theme, 'primary', 0.14)}`,
        overflow: 'hidden',
        opacity: enabled ? 1 : 0.62,
        transition: 'opacity 160ms ease'
      }}
    >
      <Box
        sx={{
          position: 'relative',
          p: isCompact ? { xs: 1.5, sm: 2 } : { xs: 2.5, sm: 3 },
          pb: isCompact && !cardExpanded ? { xs: 1.5, sm: 2 } : undefined
        }}
      >
        {dragHandle ? (
          <Box
            onClick={stopPropagation}
            onKeyDown={stopPropagation}
            sx={{
              position: 'absolute',
              top: 4,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
              '& > *': {
                pointerEvents: 'auto'
              }
            }}
          >
            {dragHandle}
          </Box>
        ) : null}

        <Stack
          direction="row"
          spacing={1.5}
          onClick={isCompact ? toggleCardExpanded : undefined}
          onKeyDown={isCompact ? handleHeaderKeyDown : undefined}
          role={isCompact ? 'button' : undefined}
          tabIndex={isCompact ? 0 : undefined}
          aria-expanded={isCompact ? cardExpanded : undefined}
          aria-label={
            isCompact
              ? cardExpanded
                ? t('proxyList.card.collapse')
                : t('proxyList.card.expand')
              : undefined
          }
          sx={{
            alignItems: 'flex-start',
            mb: showDetails && !isCompact ? 2.5 : 0,
            cursor: isCompact ? 'pointer' : 'default',
            userSelect: isCompact ? 'none' : 'auto',
            outline: 'none',
            '&:focus-visible': isCompact
              ? {
                  borderRadius: '12px',
                  boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.4)}`
                }
              : undefined
          }}
        >
          <IconButton
            ref={iconButtonRef}
            onClick={(event) => {
              stopPropagation(event)
              setIconPickerAnchor(event.currentTarget)
            }}
            aria-label={t('proxyList.actions.changeIcon')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: isCompact ? 40 : 44,
              height: isCompact ? 40 : 44,
              borderRadius: '16px',
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
            <ProxyCardAvatar
              icon={proxy.icon}
              countryCode={proxy.countryCode}
              flagSize={isCompact ? 20 : 22}
              fontSize="small"
            />
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
              <Stack
                direction="row"
                spacing={0.5}
                sx={{ alignItems: 'center', minWidth: 0, flex: 1 }}
              >
                <Box onClick={stopPropagation} onKeyDown={stopPropagation}>
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
                </Box>
                <IconButton
                  size="small"
                  onClick={(event) => {
                    stopPropagation(event)
                    onToggleFavorite()
                  }}
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
                  onClick={(event) => {
                    stopPropagation(event)
                    void handleCopy(proxy.label?.trim() || proxy.host)
                  }}
                  sx={{
                    fontSize: isCompact ? '0.98rem' : '1.05rem',
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
                {isCompact && displayLatency !== undefined && (
                  <Typography
                    variant="caption"
                    component="span"
                    onClick={stopPropagation}
                    sx={{ fontWeight: 600, lineHeight: 1, flexShrink: 0 }}
                  >
                    <LatencyText latencyMs={displayLatency} />
                  </Typography>
                )}
                {isCompact && (
                  <ExpandMoreIcon
                    fontSize="small"
                    sx={{
                      color: 'text.secondary',
                      transition: 'transform 160ms ease',
                      transform: cardExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}
                  />
                )}
              </Stack>
            </Stack>

            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <Chip
                label={proxy.protocol.toUpperCase()}
                size="small"
                onClick={(event) => {
                  stopPropagation(event)
                  void handleCopy(proxy.protocol)
                }}
                sx={{
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  bgcolor: protocolStyles.background,
                  color: protocolStyles.main,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 150ms ease',
                  '&:hover': {
                    bgcolor: alpha(protocolStyles.main, theme.palette.mode === 'dark' ? 0.36 : 0.2)
                  }
                }}
              />
              <Typography
                variant="body2"
                color="text.secondary"
                onClick={(event) => {
                  stopPropagation(event)
                  void handleCopy(address)
                }}
                sx={{ fontFamily: 'monospace', cursor: 'pointer' }}
                noWrap={isCompact}
              >
                {address}
              </Typography>
            </Stack>

            {(proxy.countryCode || proxy.city || proxy.anonymityLevel) && (
              <Stack direction="row" spacing={0.75} sx={{ mt: 1, flexWrap: 'wrap' }}>
                {proxy.countryCode && (
                  <Chip
                    size="small"
                    onClick={(event) => {
                      stopPropagation(event)
                      void handleCopy(
                        findProxyCountry(proxy.countryCode!)?.name ?? proxy.countryCode!
                      )
                    }}
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
                    onClick={(event) => {
                      stopPropagation(event)
                      void handleCopy(proxy.city!)
                    }}
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
                    onClick={(event) => {
                      stopPropagation(event)
                      void handleCopy(proxy.anonymityLevel!)
                    }}
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

        {isCompact ? (
          <Collapse in={cardExpanded} unmountOnExit>
            {detailsContent}
          </Collapse>
        ) : (
          detailsContent
        )}
      </Box>

      {isCompact ? (
        <Collapse in={cardExpanded} unmountOnExit>
          {actionsContent}
        </Collapse>
      ) : (
        actionsContent
      )}

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

      <ProxyShareDialog open={shareOpen} proxy={proxy} onClose={() => setShareOpen(false)} />

      <Menu
        open={contextMenu !== null}
        onClose={closeContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null ? { top: contextMenu.top, left: contextMenu.left } : undefined
        }
        slotProps={{
          paper: {
            sx: {
              minWidth: 220,
              borderRadius: '16px'
            }
          }
        }}
      >
        <MenuItem onClick={() => runContextAction(onCheck)} disabled={isChecking || isCheckingAll}>
          <ListItemIcon>
            {isChecking ? <CircularProgress size={18} /> : <PlayArrowIcon fontSize="small" />}
          </ListItemIcon>
          <ListItemText>{t('proxyList.actions.check')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => runContextAction(onEdit)} disabled={isCheckingAll}>
          <ListItemIcon>
            <EditOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('proxyList.actions.edit')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => runContextAction(() => setShareOpen(true))}>
          <ListItemIcon>
            <ShareOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('proxyList.actions.share')}</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => runContextAction(onDelete)}
          disabled={isCheckingAll}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon sx={{ color: 'inherit' }}>
            <DeleteOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('proxyList.actions.delete')}</ListItemText>
        </MenuItem>

        <Divider />

        <MenuItem onClick={() => runContextAction(onToggleFavorite)}>
          <ListItemIcon>
            {proxy.isFavorite ? (
              <StarIcon fontSize="small" color="warning" />
            ) : (
              <StarBorderOutlinedIcon fontSize="small" />
            )}
          </ListItemIcon>
          <ListItemText>
            {proxy.isFavorite
              ? t('proxyList.actions.removeFromFavorites')
              : t('proxyList.actions.addToFavorites')}
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={() => runContextAction(onToggleEnabled)} disabled={isCheckingAll}>
          <ListItemIcon>
            {enabled ? (
              <ToggleOffOutlinedIcon fontSize="small" />
            ) : (
              <ToggleOnOutlinedIcon fontSize="small" />
            )}
          </ListItemIcon>
          <ListItemText>
            {enabled ? t('proxyList.actions.disableProxy') : t('proxyList.actions.enableProxy')}
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={openIconPickerFromMenu}>
          <ListItemIcon>
            <ImageOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('proxyList.actions.changeIcon')}</ListItemText>
        </MenuItem>

        {onGroupChange ? (
          <>
            <Divider />
            {proxy.groupId ? (
              <MenuItem
                onClick={() => runContextAction(() => onGroupChange(undefined))}
                disabled={isCheckingAll}
              >
                <ListItemIcon>
                  <FolderOffOutlinedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>{t('proxyList.actions.removeFromGroup')}</ListItemText>
              </MenuItem>
            ) : null}
            <MenuItem
              onClick={(event) => {
                event.stopPropagation()
                setGroupMenuAnchor(event.currentTarget)
              }}
              disabled={isCheckingAll || sortedGroups.length === 0}
              aria-haspopup="true"
            >
              <ListItemIcon sx={groupMenuListItemIconSx}>
                {currentGroup ? (
                  <ProxyGroupAvatar
                    group={currentGroup}
                    size={GROUP_MENU_AVATAR_SIZE}
                    iconSize={GROUP_MENU_ICON_SIZE}
                  />
                ) : (
                  <FolderOutlinedIcon fontSize="small" />
                )}
              </ListItemIcon>
              <ListItemText
                primary={t('proxyList.actions.moveToGroup')}
                secondary={
                  currentGroup
                    ? t('proxyList.actions.currentGroup', { name: currentGroup.name })
                    : sortedGroups.length === 0
                      ? t('proxyList.actions.noGroups')
                      : undefined
                }
                slotProps={{
                  secondary: { noWrap: true }
                }}
              />
              {sortedGroups.length > 0 ? (
                <ChevronRightIcon fontSize="small" sx={{ ml: 1, color: 'text.secondary' }} />
              ) : null}
            </MenuItem>
          </>
        ) : null}

        <Divider />

        <MenuItem onClick={() => runContextCopy(address)}>
          <ListItemIcon>
            <ContentCopyOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('proxyList.actions.copyAddress')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => runContextCopy(proxyUrl)}>
          <ListItemIcon>
            <LinkOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('proxyList.actions.copyLink')}</ListItemText>
        </MenuItem>

        {isCompact && (
          <>
            <Divider />
            <MenuItem onClick={() => runContextAction(() => setCardExpanded((value) => !value))}>
              <ListItemIcon>
                {cardExpanded ? (
                  <UnfoldLessOutlinedIcon fontSize="small" />
                ) : (
                  <UnfoldMoreOutlinedIcon fontSize="small" />
                )}
              </ListItemIcon>
              <ListItemText>
                {cardExpanded ? t('proxyList.card.collapse') : t('proxyList.card.expand')}
              </ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>

      <Menu
        anchorEl={groupMenuAnchor}
        open={Boolean(groupMenuAnchor)}
        onClose={() => setGroupMenuAnchor(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              minWidth: 200,
              maxWidth: 280,
              borderRadius: '16px'
            }
          }
        }}
      >
        <MenuItem
          onClick={() => runContextAction(() => onGroupChange?.(undefined))}
          selected={!proxy.groupId}
        >
          <ListItemIcon sx={groupMenuListItemIconSx}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: GROUP_MENU_AVATAR_SIZE,
                height: GROUP_MENU_AVATAR_SIZE,
                borderRadius: '12px',
                bgcolor: 'action.hover',
                color: 'text.secondary',
                boxShadow: (theme) => `inset 0 0 0 1px ${alpha(theme.palette.divider, 0.8)}`
              }}
            >
              <FolderOffOutlinedIcon sx={{ fontSize: GROUP_MENU_ICON_SIZE }} />
            </Box>
          </ListItemIcon>
          <ListItemText>{t('proxyList.actions.noGroup')}</ListItemText>
          {!proxy.groupId ? (
            <CheckIcon fontSize="small" sx={{ ml: 1, color: 'primary.main' }} />
          ) : null}
        </MenuItem>
        {sortedGroups.map((group) => (
          <MenuItem
            key={group.id}
            onClick={() => runContextAction(() => onGroupChange?.(group.id))}
            selected={proxy.groupId === group.id}
          >
            <ListItemIcon sx={groupMenuListItemIconSx}>
              <ProxyGroupAvatar
                group={group}
                size={GROUP_MENU_AVATAR_SIZE}
                iconSize={GROUP_MENU_ICON_SIZE}
              />
            </ListItemIcon>
            <ListItemText>{group.name}</ListItemText>
            {proxy.groupId === group.id ? (
              <CheckIcon fontSize="small" sx={{ ml: 1, color: 'primary.main' }} />
            ) : null}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  )
}

export default memo(ProxyCard)
