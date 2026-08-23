import CheckIcon from '@mui/icons-material/Check'
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined'
import { Box, IconButton, Popover, Tooltip, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import type { ProxyColorId } from '@shared/types/proxy'
import { PROXY_COLOR_IDS } from '@shared/types/proxy'
import ProxyColorSwatch from './ProxyColorSwatch'

interface ProxyColorPickerPopoverProps {
  anchorEl: HTMLElement | null
  open: boolean
  value?: ProxyColorId
  includeDefault?: boolean
  onClose: () => void
  onSelect: (colorId: ProxyColorId | undefined) => void
}

function ProxyColorPickerPopover({
  anchorEl,
  open,
  value,
  includeDefault = false,
  onClose,
  onSelect
}: ProxyColorPickerPopoverProps): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const isDefault = value === undefined

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
            borderRadius: '16px',
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
        {t('proxyForm.color')}
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 0.5
        }}
      >
        {includeDefault ? (
          <Tooltip title={t('proxyGroup.defaultColor')} arrow>
            <IconButton
              onClick={() => onSelect(undefined)}
              aria-label={t('proxyGroup.defaultColor')}
              aria-pressed={isDefault}
              sx={{
                position: 'relative',
                borderRadius: '12px',
                py: 1.25,
                color: isDefault ? 'primary.main' : 'text.secondary',
                bgcolor: isDefault ? alpha(theme.palette.primary.main, 0.14) : 'transparent',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, isDefault ? 0.2 : 0.1),
                  color: 'primary.main'
                }
              }}
            >
              <PaletteOutlinedIcon fontSize="small" />
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
        ) : null}

        {PROXY_COLOR_IDS.map((colorId) => {
          const selected = value === colorId

          return (
            <Tooltip key={colorId} title={t(`proxyColors.${colorId}`)} arrow>
              <IconButton
                onClick={() => onSelect(colorId)}
                aria-label={t(`proxyColors.${colorId}`)}
                aria-pressed={selected}
                sx={{
                  position: 'relative',
                  borderRadius: '12px',
                  py: 1.25,
                  bgcolor: selected ? alpha(theme.palette.primary.main, 0.14) : 'transparent',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, selected ? 0.2 : 0.1)
                  }
                }}
              >
                <ProxyColorSwatch colorId={colorId} size={20} />
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

export default ProxyColorPickerPopover
