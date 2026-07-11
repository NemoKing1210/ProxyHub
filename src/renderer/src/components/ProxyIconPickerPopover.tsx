import AutoModeOutlinedIcon from '@mui/icons-material/AutoModeOutlined'
import CheckIcon from '@mui/icons-material/Check'
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined'
import { Box, IconButton, Popover, Tooltip, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import { PROXY_ICON_IDS, type ProxyIconId } from '../../../shared/types/proxy'
import ProxyCardAvatar from './ProxyCardAvatar'
import ProxyIcon from './ProxyIcon'

interface ProxyIconPickerPopoverProps {
  anchorEl: HTMLElement | null
  open: boolean
  value?: ProxyIconId
  countryCode?: string
  defaultOption?: 'auto' | 'folder'
  onClose: () => void
  onSelect: (iconId: ProxyIconId | undefined) => void
}

function ProxyIconPickerPopover({
  anchorEl,
  open,
  value,
  countryCode,
  defaultOption = 'auto',
  onClose,
  onSelect
}: ProxyIconPickerPopoverProps): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const isDefault = value === undefined
  const defaultLabel =
    defaultOption === 'folder' ? t('proxyGroup.defaultIcon') : t('proxyIcons.auto')

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      slotProps={{
        paper: {
          sx: {
            p: 1.5,
            borderRadius: 2.5,
            width: 280
          }
        }
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', px: 0.5, pb: 1 }}
      >
        {t('proxyForm.icon')}
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 0.5
        }}
      >
        <Tooltip title={defaultLabel} arrow>
          <IconButton
            onClick={() => onSelect(undefined)}
            aria-label={defaultLabel}
            aria-pressed={isDefault}
            sx={{
              position: 'relative',
              borderRadius: 2,
              py: 1.25,
              color: isDefault ? 'primary.main' : 'text.secondary',
              bgcolor: isDefault ? alpha(theme.palette.primary.main, 0.14) : 'transparent',
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, isDefault ? 0.2 : 0.1),
                color: 'primary.main'
              }
            }}
          >
            {defaultOption === 'folder' ? (
              <FolderOutlinedIcon fontSize="small" />
            ) : countryCode ? (
              <ProxyCardAvatar countryCode={countryCode} flagSize={20} />
            ) : (
              <AutoModeOutlinedIcon fontSize="small" />
            )}
            {isDefault ? (
              <CheckIcon
                sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  fontSize: 12,
                  color: 'primary.main'
                }}
              />
            ) : null}
          </IconButton>
        </Tooltip>

        {PROXY_ICON_IDS.map((iconId) => {
          const selected = value === iconId

          return (
            <Tooltip key={iconId} title={t(`proxyIcons.${iconId}`)} arrow>
              <IconButton
                onClick={() => onSelect(iconId)}
                aria-label={t(`proxyIcons.${iconId}`)}
                aria-pressed={selected}
                sx={{
                  position: 'relative',
                  borderRadius: 2,
                  py: 1.25,
                  color: selected ? 'primary.main' : 'text.secondary',
                  bgcolor: selected ? alpha(theme.palette.primary.main, 0.14) : 'transparent',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, selected ? 0.2 : 0.1),
                    color: 'primary.main'
                  }
                }}
              >
                <ProxyIcon iconId={iconId} fontSize="small" />
                {selected ? (
                  <CheckIcon
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      fontSize: 12,
                      color: 'primary.main'
                    }}
                  />
                ) : null}
              </IconButton>
            </Tooltip>
          )
        })}
      </Box>
    </Popover>
  )
}

export default ProxyIconPickerPopover
