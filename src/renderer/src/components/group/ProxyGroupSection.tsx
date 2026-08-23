import AddIcon from '@mui/icons-material/Add'
import ClearAllOutlinedIcon from '@mui/icons-material/ClearAllOutlined'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import DeleteSweepOutlinedIcon from '@mui/icons-material/DeleteSweepOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined'
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay'
import { useDroppable } from '@dnd-kit/core'
import {
  Box,
  Button,
  CircularProgress,
  Collapse,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Typography
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { memo, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@mui/material/styles'
import type { Proxy, ProxyColorId, ProxyIconId } from '@shared/types/proxy'
import type { ProxyGroup } from '@shared/types/proxy-group'
import { getGroupColorStyles } from '../../utils/proxy-group-appearance'
import {
  filterProxiesByGroupBadge,
  type ProxyGroupBadgeFilter
} from '../../utils/proxy-group-badge-filter'
import { getGroupPagination } from '../../utils/proxy-group-pagination'
import { getProxyCheckProgress } from '../../utils/proxy-check-progress'
import { getListCardPosition, getListCardRadius } from '../../utils/card-list'
import { elevationShadow } from '../../theme'
import ProxyCheckProgressBar from '../proxy/ProxyCheckProgressBar'
import ProxyColorPickerPopover from '../proxy/ProxyColorPickerPopover'
import ProxyGroupAvatar from './ProxyGroupAvatar'
import ProxyGroupPagination from './ProxyGroupPagination'
import ProxyIconPickerPopover from '../proxy/ProxyIconPickerPopover'
import ProxyStatBadges from '../proxy/ProxyStatBadges'

interface ContextMenuPosition {
  top: number
  left: number
}

const PROXY_GROUP_CONTENT_MAX_HEIGHT = 'min(55vh, 480px)'

interface ProxyGroupSectionProps {
  group: ProxyGroup
  proxies: Proxy[]
  canCheck: boolean
  isCheckingAll: boolean
  checkingIds: Set<string>
  dropZoneId: string
  dropZoneDisabled?: boolean
  isDragActive?: boolean
  forceExpanded?: boolean
  listRadius?: string
  renderProxyItem: (proxy: Proxy, listRadius?: string) => ReactNode
  onEdit: () => void
  onDelete: () => void
  onDeleteDead: () => void
  onClear: () => void
  onIconChange: (iconId: ProxyIconId | undefined) => void
  onColorChange: (colorId: ProxyColorId | undefined) => void
  onAddProxy: () => void
  onCheck: () => void
}

function ProxyGroupSectionImpl({
  group,
  proxies,
  canCheck,
  isCheckingAll,
  checkingIds,
  dropZoneId,
  dropZoneDisabled = false,
  isDragActive = false,
  forceExpanded = false,
  listRadius,
  renderProxyItem,
  onEdit,
  onDelete,
  onDeleteDead,
  onClear,
  onIconChange,
  onColorChange,
  onAddProxy,
  onCheck
}: ProxyGroupSectionProps): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const colorStyles = useMemo(() => getGroupColorStyles(theme, group.color), [theme, group.color])
  const proxyCount = proxies.length
  const deadProxyCount = useMemo(
    () => proxies.filter((proxy) => proxy.status === 'dead').length,
    [proxies]
  )
  const [expanded, setExpanded] = useState(false)
  const [page, setPage] = useState(1)
  const [activeFilter, setActiveFilter] = useState<ProxyGroupBadgeFilter | null>(null)
  const { setNodeRef, isOver } = useDroppable({ id: dropZoneId, disabled: dropZoneDisabled })
  const filteredProxies = useMemo(
    () => filterProxiesByGroupBadge(proxies, activeFilter),
    [activeFilter, proxies]
  )
  const { visibleProxies, pagination } = useMemo(() => {
    const state = getGroupPagination(filteredProxies.length, page)
    return {
      visibleProxies: filteredProxies.slice(state.startIndex, state.endIndex),
      pagination: state
    }
  }, [filteredProxies, page])
  const visibleItems = useMemo(
    () =>
      visibleProxies.map((proxy, index) =>
        renderProxyItem(proxy, getListCardRadius(getListCardPosition(index, visibleProxies.length)))
      ),
    [visibleProxies, renderProxyItem]
  )
  const groupCheckProgress = useMemo(
    () => getProxyCheckProgress(proxies, checkingIds),
    [checkingIds, proxies]
  )

  useEffect(() => {
    setPage(1)
  }, [group.id, proxyCount, activeFilter])

  useEffect(() => {
    setActiveFilter(null)
  }, [group.id])

  useEffect(() => {
    if (page > pagination.pageCount) {
      setPage(pagination.pageCount)
    }
  }, [page, pagination.pageCount])
  const showDropHighlight = isOver && !dropZoneDisabled
  const isExpanded = expanded || forceExpanded || showDropHighlight
  const showEmptyDropPlaceholder = proxyCount === 0 && isDragActive && showDropHighlight
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(null)
  const [iconPickerAnchor, setIconPickerAnchor] = useState<HTMLElement | null>(null)
  const [colorPickerAnchor, setColorPickerAnchor] = useState<HTMLElement | null>(null)
  const iconButtonRef = useRef<HTMLButtonElement>(null)

  const closeMenu = (): void => {
    setMenuAnchor(null)
    setContextMenu(null)
  }

  const handleContextMenu = (event: React.MouseEvent): void => {
    event.preventDefault()
    event.stopPropagation()
    setContextMenu({ top: event.clientY, left: event.clientX })
  }

  const openIconPickerFromMenu = (): void => {
    closeMenu()
    if (iconButtonRef.current) {
      setIconPickerAnchor(iconButtonRef.current)
    }
  }

  const openColorPickerFromMenu = (): void => {
    closeMenu()
    if (iconButtonRef.current) {
      setColorPickerAnchor(iconButtonRef.current)
    }
  }

  return (
    <Paper
      ref={setNodeRef}
      sx={{
        borderRadius: listRadius ?? '16px',
        overflow: 'hidden',
        bgcolor: showDropHighlight ? alpha(theme.palette.primary.main, 0.06) : colorStyles.surface,
        boxShadow: showDropHighlight
          ? `${elevationShadow(theme, 2)}, inset 0 0 0 2px ${alpha(theme.palette.primary.main, 0.45)}`
          : `${elevationShadow(theme, 1)}, inset 0 0 0 1px ${colorStyles.ring}`,
        transition: 'background-color 150ms ease, box-shadow 150ms ease'
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        onClick={() => setExpanded((value) => !value)}
        onContextMenu={handleContextMenu}
        sx={{
          alignItems: 'flex-start',
          px: 2,
          py: 1.5,
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        <IconButton
          ref={iconButtonRef}
          size="small"
          onClick={(event) => event.stopPropagation()}
          aria-label={t('proxyGroup.changeIcon')}
          sx={{ p: 0, mt: 0.25 }}
        >
          <ProxyGroupAvatar group={group} />
        </IconButton>

        <Stack sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
            {group.name}
          </Typography>
          <Box>
            <ProxyStatBadges
              proxies={proxies}
              clickable
              activeFilter={activeFilter}
              onFilterChange={(filter) => {
                setActiveFilter(filter)
                setExpanded(true)
              }}
              sx={{ mt: 0.5 }}
            />
          </Box>
        </Stack>

        <Button
          size="small"
          variant="outlined"
          startIcon={
            isCheckingAll ? <CircularProgress size={16} color="inherit" /> : <PlaylistPlayIcon />
          }
          onClick={(event) => {
            event.stopPropagation()
            onCheck()
          }}
          disabled={!canCheck || isCheckingAll}
          sx={{
            flexShrink: 0,
            alignSelf: 'center',
            display: { xs: 'none', md: 'inline-flex' },
            borderColor: colorStyles.ring,
            color: colorStyles.main,
            '&:hover': {
              borderColor: colorStyles.main,
              bgcolor: colorStyles.accent
            }
          }}
        >
          {t('proxyGroup.check')}
        </Button>

        <IconButton
          size="small"
          aria-label={t('proxyGroup.check')}
          onClick={(event) => {
            event.stopPropagation()
            onCheck()
          }}
          disabled={!canCheck || isCheckingAll}
          sx={{
            display: { xs: 'inline-flex', md: 'none' },
            alignSelf: 'center',
            color: colorStyles.main
          }}
        >
          {isCheckingAll ? <CircularProgress size={18} /> : <PlaylistPlayIcon fontSize="small" />}
        </IconButton>

        <IconButton
          size="small"
          aria-label={t('proxyGroup.actions')}
          onClick={(event) => {
            event.stopPropagation()
            setMenuAnchor(event.currentTarget)
          }}
          sx={{ alignSelf: 'center' }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>

        <IconButton
          size="small"
          aria-expanded={isExpanded}
          onClick={(event) => {
            event.stopPropagation()
            setExpanded((value) => !value)
          }}
          sx={{
            alignSelf: 'center',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 200ms ease'
          }}
        >
          <ExpandMoreIcon fontSize="small" />
        </IconButton>
      </Stack>

      <Box sx={{ px: 2, pb: groupCheckProgress ? 1 : 0 }}>
        <ProxyCheckProgressBar progress={groupCheckProgress} />
      </Box>

      <Collapse in={isExpanded} unmountOnExit={!isDragActive}>
        <Box sx={{ px: 2, pb: 2, pt: 0.5 }}>
          <Box
            sx={{
              maxHeight: PROXY_GROUP_CONTENT_MAX_HEIGHT,
              overflowY: 'auto',
              overflowX: 'hidden',
              pr: 0.5
            }}
          >
            <Stack spacing={0.75}>
              {showEmptyDropPlaceholder ? (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 72,
                    borderRadius: '12px',
                    bgcolor: alpha(theme.palette.primary.main, 0.08)
                  }}
                >
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    {t('proxyList.drag.dropToGroup')}
                  </Typography>
                </Box>
              ) : filteredProxies.length === 0 ? (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 72,
                    borderRadius: '12px',
                    bgcolor: alpha(theme.palette.primary.main, 0.06),
                    px: 2,
                    textAlign: 'center'
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {t('proxyGroup.filterEmpty')}
                  </Typography>
                </Box>
              ) : (
                visibleItems
              )}
            </Stack>
          </Box>

          {pagination.needsPagination && !showEmptyDropPlaceholder && filteredProxies.length > 0 ? (
            <Box sx={{ pt: 1 }}>
              <ProxyGroupPagination
                page={pagination.page}
                pageCount={pagination.pageCount}
                rangeStart={pagination.startIndex + 1}
                rangeEnd={pagination.endIndex}
                total={filteredProxies.length}
                onPageChange={setPage}
              />
            </Box>
          ) : null}
        </Box>
      </Collapse>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor) || contextMenu !== null}
        onClose={closeMenu}
        anchorReference={contextMenu !== null ? 'anchorPosition' : 'anchorEl'}
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
        <MenuItem
          onClick={() => {
            closeMenu()
            onEdit()
          }}
        >
          <ListItemIcon>
            <EditOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('proxyGroup.edit')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={openIconPickerFromMenu}>
          <ListItemIcon>
            <ImageOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('proxyGroup.changeIcon')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={openColorPickerFromMenu}>
          <ListItemIcon>
            <PaletteOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('proxyGroup.changeColor')}</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            closeMenu()
            setExpanded(true)
            onAddProxy()
          }}
        >
          <ListItemIcon>
            <AddIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('proxyGroup.addProxy')}</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            closeMenu()
            onDeleteDead()
          }}
          disabled={deadProxyCount === 0}
        >
          <ListItemIcon>
            <DeleteSweepOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary={t('proxyGroup.deleteDead')}
            secondary={
              deadProxyCount > 0
                ? t('proxyGroup.deleteDeadCount', { count: deadProxyCount })
                : t('proxyGroup.deleteDeadEmpty')
            }
          />
        </MenuItem>
        <MenuItem
          onClick={() => {
            closeMenu()
            onClear()
          }}
          disabled={proxyCount === 0}
        >
          <ListItemIcon>
            <ClearAllOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary={t('proxyGroup.clear')}
            secondary={
              proxyCount > 0
                ? t('proxyGroup.clearCount', { count: proxyCount })
                : t('proxyGroup.clearEmpty')
            }
          />
        </MenuItem>
        <MenuItem
          onClick={() => {
            closeMenu()
            onDelete()
          }}
        >
          <ListItemIcon>
            <DeleteOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('proxyGroup.delete')}</ListItemText>
        </MenuItem>
      </Menu>

      <ProxyIconPickerPopover
        anchorEl={iconPickerAnchor}
        open={Boolean(iconPickerAnchor)}
        value={group.icon}
        defaultOption="folder"
        onClose={() => setIconPickerAnchor(null)}
        onSelect={(iconId) => {
          setIconPickerAnchor(null)
          onIconChange(iconId)
        }}
      />

      <ProxyColorPickerPopover
        anchorEl={colorPickerAnchor}
        open={Boolean(colorPickerAnchor)}
        value={group.color}
        includeDefault
        onClose={() => setColorPickerAnchor(null)}
        onSelect={(colorId) => {
          setColorPickerAnchor(null)
          onColorChange(colorId)
        }}
      />
    </Paper>
  )
}

export default memo(ProxyGroupSectionImpl)
