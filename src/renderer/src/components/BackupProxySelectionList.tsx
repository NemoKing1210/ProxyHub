import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import CloseIcon from '@mui/icons-material/Close'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import StarOutlinedIcon from '@mui/icons-material/StarOutlined'
import {
  Box,
  Button,
  Checkbox,
  Chip,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Proxy } from '../../../shared/types/proxy'
import type { ProxyGroup } from '../../../shared/types/proxy-group'
import { formatProxyAddress } from '../../../shared/utils/proxy-format'
import { matchesProxySearch } from '../utils/matches-proxy-search'
import { organizeProxiesByGroup } from '../utils/organize-proxies-by-group'
import { getProxyProtocolStyles } from '../utils/proxy-protocol-styles'
import { MD3_DURATION, MD3_EASING, outlineVariant, surfaceContainer } from '../theme'
import ProxyCardAvatar from './ProxyCardAvatar'
import ProxyGroupAvatar from './ProxyGroupAvatar'

interface BackupProxySelectionListProps {
  proxies: Proxy[]
  groups: ProxyGroup[]
  selectedIds: Set<string>
  onSelectedIdsChange: (selectedIds: Set<string>) => void
  disabled?: boolean
}

function BackupProxySelectionList({
  proxies,
  groups,
  selectedIds,
  onSelectedIdsChange,
  disabled = false
}: BackupProxySelectionListProps): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const [searchQuery, setSearchQuery] = useState('')

  const groupNameById = useMemo(
    () => new Map(groups.map((group) => [group.id, group.name])),
    [groups]
  )

  const filteredProxies = useMemo(
    () => proxies.filter((proxy) => matchesProxySearch(proxy, searchQuery, groupNameById)),
    [groupNameById, proxies, searchQuery]
  )

  const organized = useMemo(
    () => organizeProxiesByGroup(filteredProxies, groups),
    [filteredProxies, groups]
  )

  const visibleSections = useMemo(
    () => organized.groups.filter((section) => section.proxies.length > 0),
    [organized.groups]
  )

  const setSelection = (ids: Iterable<string>, selected: boolean): void => {
    const next = new Set(selectedIds)

    for (const id of ids) {
      if (selected) {
        next.add(id)
      } else {
        next.delete(id)
      }
    }

    onSelectedIdsChange(next)
  }

  const handleToggleProxy = (proxyId: string, checked: boolean): void => {
    setSelection([proxyId], checked)
  }

  const handleToggleGroup = (groupProxies: Proxy[], checked: boolean): void => {
    setSelection(
      groupProxies.map((proxy) => proxy.id),
      checked
    )
  }

  const handleSelectVisible = (): void => {
    setSelection(
      filteredProxies.map((proxy) => proxy.id),
      true
    )
  }

  const handleClearVisible = (): void => {
    setSelection(
      filteredProxies.map((proxy) => proxy.id),
      false
    )
  }

  const handleSelectFavorites = (): void => {
    setSelection(
      proxies.filter((proxy) => proxy.isFavorite).map((proxy) => proxy.id),
      true
    )
  }

  const selectedCount = selectedIds.size
  const hasSearch = Boolean(searchQuery.trim())

  const renderProxyRow = (proxy: Proxy): React.JSX.Element => {
    const checked = selectedIds.has(proxy.id)
    const protocolStyles = getProxyProtocolStyles(theme, proxy.protocol)
    const title = proxy.label?.trim() || formatProxyAddress(proxy)
    const subtitle = proxy.label?.trim() ? formatProxyAddress(proxy) : null

    return (
      <Box
        key={proxy.id}
        onClick={() => !disabled && handleToggleProxy(proxy.id, !checked)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          px: 1.5,
          py: 1.1,
          borderRadius: 2,
          cursor: disabled ? 'default' : 'pointer',
          bgcolor: checked ? surfaceContainer(theme, 'high') : surfaceContainer(theme, 'low'),
          opacity: disabled ? 0.72 : checked ? 1 : 0.86,
          transition: `background-color ${MD3_DURATION.short4}ms ${MD3_EASING.standard}, transform ${MD3_DURATION.short3}ms ${MD3_EASING.standard}, opacity ${MD3_DURATION.short4}ms ${MD3_EASING.standard}`,
          ...(!disabled && {
            '&:hover': {
              bgcolor: surfaceContainer(theme, 'default'),
              transform: 'translateX(2px)'
            }
          })
        }}
      >
        <Checkbox
          checked={checked}
          size="small"
          tabIndex={-1}
          disabled={disabled}
          sx={{ p: 0.25, flexShrink: 0 }}
          onChange={(event) => {
            event.stopPropagation()
            handleToggleProxy(proxy.id, event.target.checked)
          }}
        />
        <ProxyCardAvatar icon={proxy.icon} countryCode={proxy.countryCode} flagSize={20} fontSize="small" />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: checked ? 600 : 500,
                color: checked ? 'text.primary' : 'text.secondary',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {title}
            </Typography>
            {proxy.isFavorite && (
              <StarOutlinedIcon sx={{ fontSize: 16, color: 'warning.main', flexShrink: 0 }} />
            )}
          </Stack>
          {subtitle && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        <Chip
          label={proxy.protocol.toUpperCase()}
          size="small"
          sx={{
            height: 22,
            fontSize: '0.68rem',
            fontWeight: 700,
            bgcolor: protocolStyles.background,
            color: protocolStyles.main,
            flexShrink: 0
          }}
        />
        {checked && (
          <CheckCircleOutlinedIcon sx={{ fontSize: 18, color: 'primary.main', flexShrink: 0 }} />
        )}
      </Box>
    )
  }

  const renderGroupSection = (group: ProxyGroup, groupProxies: Proxy[]): React.JSX.Element => {
    const selectedInGroup = groupProxies.filter((proxy) => selectedIds.has(proxy.id)).length
    const allSelected = groupProxies.length > 0 && selectedInGroup === groupProxies.length
    const someSelected = selectedInGroup > 0 && !allSelected

    return (
      <Box key={group.id}>
        <Box
          onClick={() => !disabled && handleToggleGroup(groupProxies, !allSelected)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 0.5,
            py: 0.75,
            mb: 0.75,
            borderRadius: 2,
            cursor: disabled ? 'default' : 'pointer',
            ...(!disabled && {
              '&:hover': {
                bgcolor: surfaceContainer(theme, 'low')
              }
            })
          }}
        >
          <Checkbox
            checked={allSelected}
            indeterminate={someSelected}
            size="small"
            tabIndex={-1}
            disabled={disabled}
            sx={{ p: 0.25 }}
            onChange={(event) => {
              event.stopPropagation()
              handleToggleGroup(groupProxies, event.target.checked)
            }}
          />
          <ProxyGroupAvatar group={group} size={28} iconSize={16} />
          <Typography variant="subtitle2" sx={{ flex: 1 }}>
            {group.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {selectedInGroup}/{groupProxies.length}
          </Typography>
        </Box>
        <Stack spacing={0.75} sx={{ pl: 0.5 }}>
          {groupProxies.map((proxy) => renderProxyRow(proxy))}
        </Stack>
      </Box>
    )
  }

  return (
    <Stack spacing={1.5}>
      <Box
        sx={{
          p: 1.5,
          borderRadius: 2.5,
          bgcolor: surfaceContainer(theme, 'low'),
          boxShadow: `inset 0 0 0 1px ${outlineVariant(theme)}`
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', mb: 1.25 }}
        >
          <Chip
            label={t('settings.backup.exportSelectSelected', {
              selected: selectedCount,
              total: proxies.length
            })}
            size="small"
            color={selectedCount > 0 ? 'primary' : 'default'}
            sx={{ fontWeight: 700, alignSelf: { xs: 'flex-start', sm: 'center' } }}
          />
          <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <Button
              size="small"
              onClick={handleSelectVisible}
              disabled={disabled || filteredProxies.length === 0}
            >
              {t('settings.backup.exportSelectAll')}
            </Button>
            <Button
              size="small"
              onClick={handleClearVisible}
              disabled={disabled || filteredProxies.length === 0}
            >
              {t('settings.backup.exportSelectNone')}
            </Button>
            <Button
              size="small"
              startIcon={<StarOutlinedIcon />}
              onClick={handleSelectFavorites}
              disabled={disabled || proxies.every((proxy) => !proxy.isFavorite)}
            >
              {t('settings.backup.exportSelectFavorites')}
            </Button>
          </Stack>
        </Stack>

        <TextField
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={t('settings.backup.exportSelectSearch')}
          size="small"
          fullWidth
          disabled={disabled}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlinedIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery('')} edge="end" disabled={disabled}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : undefined
            }
          }}
        />
      </Box>

      <Box
        sx={{
          maxHeight: 360,
          overflowY: 'auto',
          pr: 0.5,
          '&::-webkit-scrollbar': { width: 8 },
          '&::-webkit-scrollbar-thumb': {
            borderRadius: 999,
            bgcolor: 'action.disabled'
          }
        }}
      >
        {proxies.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
            {t('settings.backup.exportSelectEmpty')}
          </Typography>
        ) : filteredProxies.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
            {t('settings.backup.exportSelectNoResults')}
          </Typography>
        ) : (
          <Stack spacing={2}>
            {visibleSections.map((section) => renderGroupSection(section.group, section.proxies))}

            {organized.ungrouped.length > 0 && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 0.5, py: 0.75, mb: 0.75 }}>
                  <Typography variant="subtitle2" sx={{ flex: 1 }}>
                    {t('settings.backup.exportSelectUngrouped')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {organized.ungrouped.filter((proxy) => selectedIds.has(proxy.id)).length}/
                    {organized.ungrouped.length}
                  </Typography>
                </Box>
                <Stack spacing={0.75} sx={{ pl: 0.5 }}>
                  {organized.ungrouped.map((proxy) => renderProxyRow(proxy))}
                </Stack>
              </Box>
            )}
          </Stack>
        )}
      </Box>

      {hasSearch && filteredProxies.length > 0 && (
        <Typography variant="caption" color="text.secondary">
          {t('settings.backup.exportSelectFiltered', { count: filteredProxies.length })}
        </Typography>
      )}
    </Stack>
  )
}

export default BackupProxySelectionList
