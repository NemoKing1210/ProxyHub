import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined'
import CropSquareOutlinedIcon from '@mui/icons-material/CropSquareOutlined'
import FilterNoneOutlinedIcon from '@mui/icons-material/FilterNoneOutlined'
import MinimizeOutlinedIcon from '@mui/icons-material/MinimizeOutlined'
import { Box, IconButton } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getPalette, withThemeAlpha } from '../../theme'

function AppWindowControls(): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const palette = getPalette(theme)
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    let active = true

    void window.api.getWindowMaximized().then((maximized) => {
      if (active) {
        setIsMaximized(maximized)
      }
    })

    const unsubscribe = window.api.onWindowMaximizedChange(setIsMaximized)

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const controlSx = {
    width: 30,
    height: 30,
    borderRadius: '12px',
    color: palette.text.secondary,
    '&:hover': {
      color: palette.primary.main,
      bgcolor: withThemeAlpha(theme, palette.primary.main, 0.12)
    }
  }

  const handleToggleMaximize = async (): Promise<void> => {
    setIsMaximized(await window.api.toggleWindowMaximize())
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.25,
        flexShrink: 0,
        WebkitAppRegion: 'no-drag'
      }}
    >
      <IconButton
        size="small"
        aria-label={t('windowControls.minimize')}
        title={t('windowControls.minimize')}
        onClick={() => void window.api.minimizeWindow()}
        sx={controlSx}
      >
        <MinimizeOutlinedIcon sx={{ fontSize: 17 }} />
      </IconButton>
      <IconButton
        size="small"
        aria-label={isMaximized ? t('windowControls.restoreDown') : t('windowControls.maximize')}
        title={isMaximized ? t('windowControls.restoreDown') : t('windowControls.maximize')}
        onClick={() => void handleToggleMaximize()}
        sx={controlSx}
      >
        {isMaximized ? (
          <FilterNoneOutlinedIcon sx={{ fontSize: 16 }} />
        ) : (
          <CropSquareOutlinedIcon sx={{ fontSize: 16 }} />
        )}
      </IconButton>
      <IconButton
        size="small"
        aria-label={t('windowControls.close')}
        title={t('windowControls.close')}
        onClick={() => void window.api.closeWindow()}
        sx={{
          ...controlSx,
          '&:hover': {
            color: palette.error.main,
            bgcolor: withThemeAlpha(theme, palette.error.main, 0.14)
          }
        }}
      >
        <CloseOutlinedIcon sx={{ fontSize: 18 }} />
      </IconButton>
    </Box>
  )
}

export default AppWindowControls
