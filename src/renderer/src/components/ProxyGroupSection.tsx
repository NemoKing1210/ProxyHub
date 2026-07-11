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
  Chip,
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
import { useMemo, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@mui/material/styles'
import type { ProxyColorId, ProxyIconId } from '../../../shared/types/proxy'
import type { ProxyGroup } from '../../../shared/types/proxy-group'
import { getGroupColorStyles } from '../../../shared/utils/proxy-group-appearance'
import { elevationShadow } from '../theme'
import ProxyColorPickerPopover from './ProxyColorPickerPopover'
import ProxyGroupAvatar from './ProxyGroupAvatar'
import ProxyIconPickerPopover from './ProxyIconPickerPopover'

interface ContextMenuPosition {
  top: number
  left: number
}

interface ProxyGroupSectionProps {
  group: ProxyGroup
  proxyCount: number
  deadProxyCount: number
  canCheck: boolean
  isCheckingAll: boolean
  dropZoneId: string
  dropZoneDisabled?: boolean
  isDragActive?: boolean
  forceExpanded?: boolean
  children: ReactNode
  onEdit: () => void
  onDelete: () => void
  onDeleteDead: () => void
  onClear: () => void
  onIconChange: (iconId: ProxyIconId | undefined) => void
  onColorChange: (colorId: ProxyColorId | undefined) => void
  onAddProxy: () => void
  onCheck: () => void
}

function ProxyGroupSection({
  group,
  proxyCount,
  deadProxyCount,
  canCheck,
  isCheckingAll,
  dropZoneId,
  dropZoneDisabled = false,
  isDragActive = false,
  forceExpanded = false,
  children,
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
  const [expanded, setExpanded] = useState(true)
  const { setNodeRef, isOver } = useDroppable({ id: dropZoneId, disabled: dropZoneDisabled })
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
        borderRadius: 3,
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
          alignItems: 'center',
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
          sx={{ p: 0 }}
        >
          <ProxyGroupAvatar group={group} />
        </IconButton>

        <Stack sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
            {group.name}
          </Typography>
        </Stack>

        <Chip
          label={t('proxyGroup.proxyCount', { count: proxyCount })}
          size="small"
          sx={{ fontWeight: 600, display: { xs: 'none', sm: 'flex' } }}
        />

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
            color: colorStyles.main
          }}
        >
          {isCheckingAll ? <CircularProgress size={18} /> : <PlaylistPlayIcon fontSize="small" />}
        </IconButton>

        <Button
          size="small"
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={(event) => {
            event.stopPropagation()
            setExpanded(true)
            onAddProxy()
          }}
          sx={{
            flexShrink: 0,
            display: { xs: 'none', md: 'inline-flex' },
            borderColor: colorStyles.ring,
            color: colorStyles.main,
            '&:hover': {
              borderColor: colorStyles.main,
              bgcolor: colorStyles.accent
            }
          }}
        >
          {t('proxyGroup.addProxy')}
        </Button>

        <IconButton
          size="small"
          aria-label={t('proxyGroup.addProxy')}
          onClick={(event) => {
            event.stopPropagation()
            setExpanded(true)
            onAddProxy()
          }}
          sx={{
            display: { xs: 'inline-flex', md: 'none' },
            color: colorStyles.main
          }}
        >
          <AddIcon fontSize="small" />
        </IconButton>

        <IconButton
          size="small"
          aria-label={t('proxyGroup.actions')}
          onClick={(event) => {
            event.stopPropagation()
            setMenuAnchor(event.currentTarget)
          }}
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
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 200ms ease'
          }}
        >
          <ExpandMoreIcon fontSize="small" />
        </IconButton>
      </Stack>

      <Collapse in={isExpanded} unmountOnExit={!isDragActive}>
        <Stack spacing={2} sx={{ px: 2, pb: 2, pt: 0.5 }}>
          {showEmptyDropPlaceholder ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 72,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.08)
              }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                {t('proxyList.drag.dropToGroup')}
              </Typography>
            </Box>
          ) : (
            children
          )}
        </Stack>
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
              borderRadius: 2
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

export default ProxyGroupSection
