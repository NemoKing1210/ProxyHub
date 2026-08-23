import { Box, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useEffect, useState } from 'react'
import { TITLE_BAR_HEIGHT } from '@shared/theme/title-bar'
import { getPalette } from '../../theme'
import AppNavigation from './AppNavigation'
import AppWindowControls from './AppWindowControls'

interface AppTitleBarProps {
  activePath?: string | null
  proxyCount?: number
  isCheckingAll?: boolean
}

function AppTitleBar({
  activePath,
  proxyCount = 0,
  isCheckingAll = false
}: AppTitleBarProps): React.JSX.Element {
  const theme = useTheme()
  const palette = getPalette(theme)
  const [version, setVersion] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    void window.api
      .getAppInfo()
      .then((info) => {
        if (active) {
          setVersion(info.version)
        }
      })
      .catch(() => undefined)

    return () => {
      active = false
    }
  }, [])

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        position: 'relative',
        height: TITLE_BAR_HEIGHT,
        px: 1.25,
        pt: 1,
        flexShrink: 0,
        bgcolor: palette.background.default,
        WebkitAppRegion: 'drag'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          flexShrink: 0,
          WebkitAppRegion: 'no-drag'
        }}
      >
        <Typography
          variant="caption"
          sx={{ fontWeight: 700, letterSpacing: '0.02em', color: 'text.primary' }}
        >
          ProxyHub
        </Typography>
        {version && (
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontSize: '0.64rem',
              fontVariantNumeric: 'tabular-nums'
            }}
          >
            v{version}
          </Typography>
        )}
      </Box>

      {activePath !== undefined && (
        <Box
          sx={{
            position: 'absolute',
            top: 'calc(50% + 4px)',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            WebkitAppRegion: 'no-drag'
          }}
        >
          <AppNavigation
            activePath={activePath}
            proxyCount={proxyCount}
            isCheckingAll={isCheckingAll}
            compact
          />
        </Box>
      )}

      <Box sx={{ flex: 1, minWidth: 0 }} />
      <AppWindowControls />
    </Box>
  )
}

export default AppTitleBar
