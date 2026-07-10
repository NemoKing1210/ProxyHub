import AddIcon from '@mui/icons-material/Add'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined'
import {
  Button,
  Chip,
  Collapse,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Typography
} from '@mui/material'
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

interface ProxyGroupSectionProps {
  group: ProxyGroup
  proxyCount: number
  children: ReactNode
  onEdit: () => void
  onDelete: () => void
  onIconChange: (iconId: ProxyIconId | undefined) => void
  onColorChange: (colorId: ProxyColorId | undefined) => void
  onAddProxy: () => void
}

function ProxyGroupSection({
  group,
  proxyCount,
  children,
  onEdit,
  onDelete,
  onIconChange,
  onColorChange,
  onAddProxy
}: ProxyGroupSectionProps): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const colorStyles = useMemo(() => getGroupColorStyles(theme, group.color), [theme, group.color])
  const [expanded, setExpanded] = useState(true)
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const [iconPickerAnchor, setIconPickerAnchor] = useState<HTMLElement | null>(null)
  const [colorPickerAnchor, setColorPickerAnchor] = useState<HTMLElement | null>(null)
  const iconButtonRef = useRef<HTMLButtonElement>(null)

  const closeMenu = (): void => {
    setMenuAnchor(null)
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
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        bgcolor: colorStyles.surface,
        boxShadow: `${elevationShadow(theme, 1)}, inset 0 0 0 1px ${colorStyles.ring}`
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        onClick={() => setExpanded((value) => !value)}
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
          aria-expanded={expanded}
          onClick={(event) => {
            event.stopPropagation()
            setExpanded((value) => !value)
          }}
          sx={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 200ms ease'
          }}
        >
          <ExpandMoreIcon fontSize="small" />
        </IconButton>
      </Stack>

      <Collapse in={expanded} unmountOnExit>
        <Stack spacing={2} sx={{ px: 2, pb: 2, pt: 0.5 }}>
          {children}
        </Stack>
      </Collapse>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
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
