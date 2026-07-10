import AddIcon from '@mui/icons-material/Add'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined'
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined'
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay'
import StarIcon from '@mui/icons-material/Star'
import ToggleOnOutlinedIcon from '@mui/icons-material/ToggleOnOutlined'
import { Box, Button, Chip, CircularProgress, Paper, Stack, Typography } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import { useTheme } from '@mui/material/styles'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState, type ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import type { Proxy, ProxyIconId, ProxyInput } from '../../../shared/types/proxy'
import { DEFAULT_PROXY_COLOR_ID, PROXY_ICON_AUTO_VALUE } from '../../../shared/types/proxy'
import { normalizeCountryCode } from '../../../shared/constants/proxy-countries'
import { normalizeAnonymityLevel } from '../../../shared/utils/proxy-import'
import { normalizeProxyColorId } from '../../../shared/utils/proxy-colors'
import { filterEnabledProxies, isProxyEnabled } from '../../../shared/utils/proxy-enabled'
import { useProxyListViewState } from '../hooks/useProxyListViewState'
import { useProxyStore } from '../store/proxyStore'
import { useSettingsStore } from '../store/settingsStore'
import { filterProxies, hasActiveFilters } from '../utils/filter-proxies'
import {
  badgeTransition,
  listItemTransition,
  listLayoutTransition,
  proxyCardVariants,
  statBadgeVariants,
  usePrefersReducedMotion
} from '../utils/list-motion'
import { sortProxies, sortProxiesByFavorite } from '../utils/sort-proxies'
import { elevationShadow, getPalette, surfaceContainer, surfaceTint, withThemeAlpha } from '../theme'
import type { ProxyFormValues } from '../validation/proxySchema'
import ProxyCard from './ProxyCard'
import ProxyDeleteConfirmDialog from './ProxyDeleteConfirmDialog'
import ProxyDetailsDialog from './ProxyDetailsDialog'
import ProxyFormDialog from './ProxyFormDialog'
import ProxyListFilters from './ProxyListFilters'
import ProxyListSearch from './ProxyListSearch'
import ProxyListSort from './ProxyListSort'

function toProxyInput(values: ProxyFormValues): ProxyInput {
  return {
    protocol: values.protocol,
    host: values.host.trim(),
    port: values.port,
    label: values.label?.trim() || undefined,
    icon: values.icon === PROXY_ICON_AUTO_VALUE ? undefined : values.icon,
    color: (() => {
      const color = normalizeProxyColorId(values.color)
      return color && color !== DEFAULT_PROXY_COLOR_ID ? color : undefined
    })(),
    username: values.username?.trim() || undefined,
    password: values.password || undefined,
    secret: values.secret?.trim() || undefined,
    countryCode: normalizeCountryCode(values.countryCode),
    city: values.city?.trim() || undefined,
    anonymityLevel: normalizeAnonymityLevel(values.anonymityLevel)
  }
}

interface StatBadgeItem {
  key: string
  icon: ReactElement
  label: string
  sx: SxProps<Theme>
}

function ProxyList(): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const reducedMotion = usePrefersReducedMotion()
  const {
    proxies,
    isLoading,
    isCheckingAll,
    checkingIds,
    loadProxies,
    addProxy,
    updateProxy,
    patchProxy,
    toggleFavorite,
    toggleEnabled,
    removeProxy,
    checkProxy,
    checkAll,
    detailsProxyId,
    setDetailsProxyId
  } = useProxyStore()
  const proxyCardView = useSettingsStore((state) => state.settings.proxyCardView)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add')
  const [editingProxy, setEditingProxy] = useState<Proxy | undefined>()
  const [deletingProxy, setDeletingProxy] = useState<Proxy | undefined>()
  const {
    filters,
    sortField,
    sortDirection,
    setFilters,
    updateFilters,
    setSortField,
    setSortDirection,
    resetFilters
  } = useProxyListViewState()

  useEffect(() => {
    void loadProxies()
  }, [loadProxies])

  const openAddDialog = (): void => {
    setDialogMode('add')
    setEditingProxy(undefined)
    setDialogOpen(true)
  }

  const openEditDialog = (proxy: Proxy): void => {
    setDialogMode('edit')
    setEditingProxy(proxy)
    setDialogOpen(true)
  }

  const openDeleteDialog = (proxy: Proxy): void => {
    setDeletingProxy(proxy)
  }

  const handleDeleteConfirm = async (proxyId: string): Promise<void> => {
    await removeProxy(proxyId)
  }

  const handleSubmit = async (values: ProxyFormValues): Promise<void> => {
    const input = toProxyInput(values)

    if (dialogMode === 'add') {
      await addProxy(input)
      return
    }

    if (editingProxy) {
      await updateProxy(editingProxy.id, input)
    }
  }

  const handleIconChange = async (proxy: Proxy, iconId: ProxyIconId | undefined): Promise<void> => {
    await patchProxy(proxy.id, { icon: iconId })
  }

  const filteredProxies = useMemo(() => filterProxies(proxies, filters), [proxies, filters])
  const visibleProxies = useMemo(() => {
    const sorted = sortProxies(filteredProxies, sortField, sortDirection)
    return sortProxiesByFavorite(sorted)
  }, [filteredProxies, sortField, sortDirection])
  const checkableProxyIds = useMemo(
    () => filterEnabledProxies(visibleProxies).map((proxy) => proxy.id),
    [visibleProxies]
  )
  const filtersActive = hasActiveFilters(filters)
  const detailsProxy = useMemo(
    () => proxies.find((proxy) => proxy.id === detailsProxyId),
    [proxies, detailsProxyId]
  )

  const aliveCount = proxies.filter((proxy) => proxy.status === 'alive').length
  const deadCount = proxies.filter((proxy) => proxy.status === 'dead').length
  const enabledCount = proxies.filter(isProxyEnabled).length
  const favoritesCount = proxies.filter((proxy) => proxy.isFavorite).length
  const palette = getPalette(theme)

  const statBadgeSx = {
    fontWeight: 700,
    border: 'none',
    '& .MuiChip-icon': {
      fontSize: 16,
      ml: 0.75
    },
    '& .MuiChip-label': {
      px: 1
    }
  } as const

  const statBadges = useMemo((): StatBadgeItem[] => {
    const badges: StatBadgeItem[] = []

    if (proxies.length > 0) {
      badges.push({
        key: 'total',
        icon: <DnsOutlinedIcon />,
        label: t('proxyList.statsTotal', { count: proxies.length }),
        sx: {
          ...statBadgeSx,
          bgcolor: surfaceContainer(theme, 'default'),
          color: 'text.primary',
          '& .MuiChip-icon': {
            ...statBadgeSx['& .MuiChip-icon'],
            color: 'primary.main'
          }
        }
      })
    }

    if (aliveCount > 0) {
      badges.push({
        key: 'alive',
        icon: <CheckCircleOutlinedIcon />,
        label: t('proxyList.statsAlive', { count: aliveCount }),
        sx: {
          ...statBadgeSx,
          bgcolor: withThemeAlpha(theme, palette.success.main, 0.14),
          color: palette.success.main,
          '& .MuiChip-icon': {
            ...statBadgeSx['& .MuiChip-icon'],
            color: palette.success.main
          }
        }
      })
    }

    if (deadCount > 0) {
      badges.push({
        key: 'dead',
        icon: <ErrorOutlineOutlinedIcon />,
        label: t('proxyList.statsDead', { count: deadCount }),
        sx: {
          ...statBadgeSx,
          bgcolor: withThemeAlpha(theme, palette.error.main, 0.14),
          color: palette.error.main,
          '& .MuiChip-icon': {
            ...statBadgeSx['& .MuiChip-icon'],
            color: palette.error.main
          }
        }
      })
    }

    if (enabledCount > 0) {
      badges.push({
        key: 'enabled',
        icon: <ToggleOnOutlinedIcon />,
        label: t('proxyList.statsEnabled', { count: enabledCount }),
        sx: {
          ...statBadgeSx,
          bgcolor: withThemeAlpha(theme, palette.primary.main, 0.14),
          color: palette.primary.main,
          '& .MuiChip-icon': {
            ...statBadgeSx['& .MuiChip-icon'],
            color: palette.primary.main
          }
        }
      })
    }

    if (favoritesCount > 0) {
      badges.push({
        key: 'favorites',
        icon: <StarIcon />,
        label: t('proxyList.statsFavorites', { count: favoritesCount }),
        sx: {
          ...statBadgeSx,
          bgcolor: withThemeAlpha(theme, palette.warning.main, 0.14),
          color: palette.warning.main,
          '& .MuiChip-icon': {
            ...statBadgeSx['& .MuiChip-icon'],
            color: palette.warning.main
          }
        }
      })
    }

    return badges
  }, [
    aliveCount,
    deadCount,
    enabledCount,
    favoritesCount,
    palette.error.main,
    palette.primary.main,
    palette.success.main,
    palette.warning.main,
    proxies.length,
    t,
    theme
  ])

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ mb: 3, alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
      >
        <Box>
          <Typography variant="h5" gutterBottom>
            {t('proxyList.title')}
          </Typography>
          <Stack
            direction="row"
            spacing={0.75}
            component={motion.div}
            layout={!reducedMotion}
            sx={{ flexWrap: 'wrap', mt: 0.5, gap: 0.75 }}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {statBadges.map((badge) => (
                <motion.div
                  key={badge.key}
                  layout={!reducedMotion}
                  variants={reducedMotion ? undefined : statBadgeVariants}
                  initial={reducedMotion ? false : 'initial'}
                  animate={reducedMotion ? undefined : 'animate'}
                  exit={reducedMotion ? undefined : 'exit'}
                  transition={
                    reducedMotion
                      ? { duration: 0 }
                      : { layout: listLayoutTransition, ...badgeTransition }
                  }
                >
                  <Chip icon={badge.icon} label={badge.label} size="small" sx={badge.sx} />
                </motion.div>
              ))}
            </AnimatePresence>
          </Stack>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={isCheckingAll ? <CircularProgress size={18} /> : <PlaylistPlayIcon />}
            onClick={() => void checkAll(checkableProxyIds)}
            disabled={checkableProxyIds.length === 0 || isCheckingAll}
          >
            {t('proxyList.checkAll')}
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAddDialog}>
            {t('proxyList.addProxy')}
          </Button>
        </Stack>
      </Stack>

      {isLoading && proxies.length === 0 ? (
        <Paper
          sx={{
            py: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            borderRadius: 3,
            boxShadow: elevationShadow(theme, 1)
          }}
        >
          <CircularProgress size={36} thickness={4} />
          <Typography variant="body2" color="text.secondary">
            {t('proxyList.title')}
          </Typography>
        </Paper>
      ) : proxies.length === 0 ? (
        <Paper
          sx={{
            py: 10,
            px: 3,
            textAlign: 'center',
            borderRadius: 3,
            boxShadow: elevationShadow(theme, 1),
            bgcolor: surfaceContainer(theme, 'low')
          }}
        >
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 64,
              height: 64,
              borderRadius: 4,
              mb: 2,
              bgcolor: surfaceTint(theme),
              color: 'primary.main'
            }}
          >
            <DnsOutlinedIcon sx={{ fontSize: 32 }} />
          </Box>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
            {t('proxyList.empty')}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openAddDialog}
            sx={{ mt: 1 }}
          >
            {t('proxyList.addProxy')}
          </Button>
        </Paper>
      ) : (
        <Stack spacing={2}>
          <ProxyListFilters
            proxies={proxies}
            filters={filters}
            shownCount={visibleProxies.length}
            onChange={setFilters}
          />

          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{ alignItems: 'stretch' }}
          >
            <Box sx={{ flex: 1, minWidth: 0, display: 'flex' }}>
              <ProxyListSearch
                value={filters.searchQuery}
                onChange={(searchQuery) => updateFilters({ searchQuery })}
              />
            </Box>

            <Box sx={{ flex: 1, minWidth: 0, display: 'flex' }}>
              <ProxyListSort
                sortField={sortField}
                sortDirection={sortDirection}
                onSortFieldChange={setSortField}
                onSortDirectionChange={setSortDirection}
              />
            </Box>
          </Stack>

          {visibleProxies.length === 0 ? (
            <Paper
              sx={{
                py: 6,
                px: 3,
                textAlign: 'center',
                borderRadius: 3,
                boxShadow: elevationShadow(theme, 1),
                bgcolor: surfaceContainer(theme, 'low')
              }}
            >
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                {t('proxyList.filters.noResults')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t('proxyList.filters.noResultsHint')}
              </Typography>
              {filtersActive && (
                <Button variant="outlined" onClick={resetFilters}>
                  {t('proxyList.filters.clear')}
                </Button>
              )}
            </Paper>
          ) : (
            <AnimatePresence mode="popLayout" initial={false}>
              {visibleProxies.map((proxy) => (
                <motion.div
                  key={proxy.id}
                  layout={!reducedMotion}
                  variants={reducedMotion ? undefined : proxyCardVariants}
                  initial={reducedMotion ? false : 'initial'}
                  animate={reducedMotion ? undefined : 'animate'}
                  exit={reducedMotion ? undefined : 'exit'}
                  transition={
                    reducedMotion
                      ? { duration: 0 }
                      : { layout: listLayoutTransition, ...listItemTransition }
                  }
                  style={{ overflow: 'hidden' }}
                >
                  <ProxyCard
                    proxy={proxy}
                    variant={proxyCardView}
                    isChecking={checkingIds.has(proxy.id)}
                    isCheckingAll={isCheckingAll}
                    onCheck={() => void checkProxy(proxy.id)}
                    onEdit={() => openEditDialog(proxy)}
                    onDelete={() => openDeleteDialog(proxy)}
                    onIconChange={(iconId) => void handleIconChange(proxy, iconId)}
                    onToggleFavorite={() => void toggleFavorite(proxy.id)}
                    onToggleEnabled={() => void toggleEnabled(proxy.id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </Stack>
      )}

      <ProxyFormDialog
        open={dialogOpen}
        mode={dialogMode}
        initialProxy={editingProxy}
        existingProxies={proxies}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />

      <ProxyDeleteConfirmDialog
        open={Boolean(deletingProxy)}
        proxy={deletingProxy}
        onClose={() => setDeletingProxy(undefined)}
        onConfirm={handleDeleteConfirm}
      />

      <ProxyDetailsDialog
        open={Boolean(detailsProxy)}
        proxy={detailsProxy}
        isChecking={detailsProxy ? checkingIds.has(detailsProxy.id) : false}
        onClose={() => setDetailsProxyId(null)}
        onCheck={() => {
          if (detailsProxy) {
            void checkProxy(detailsProxy.id)
          }
        }}
      />
    </Box>
  )
}

export default ProxyList
