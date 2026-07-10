import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import { Box, Button, CircularProgress, Container } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useMatch } from 'react-router-dom'
import { useProxyStore } from '../store/proxyStore'
import { elevationShadow, getPalette, MD3_DURATION, MD3_EASING, surfaceContainer, withThemeAlpha } from '../theme'
import { TITLE_BAR_HEIGHT } from '../../../shared/theme/title-bar'
import { isWindows } from '../utils/platform'
import PageTransition from './PageTransition'
import TrayNavigationSync from './TrayNavigationSync'

const NAV_ITEMS = [
  { path: '/', labelKey: 'nav.proxies', icon: DnsOutlinedIcon, end: true },
  { path: '/settings', labelKey: 'nav.settings', icon: SettingsOutlinedIcon, end: true }
] as const

function AppLayout(): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const proxyCount = useProxyStore((state) => state.proxies.length)
  const isCheckingAll = useProxyStore((state) => state.isCheckingAll)
  const loadProxies = useProxyStore((state) => state.loadProxies)
  const isProxies = useMatch({ path: '/', end: true })
  const isSettings = useMatch({ path: '/settings', end: true })

  const activePath = isProxies ? '/' : isSettings ? '/settings' : null

  useEffect(() => {
    void loadProxies()
  }, [loadProxies])

  const palette = getPalette(theme)
  const setDetailsProxyId = useProxyStore((state) => state.setDetailsProxyId)
  const headerRef = useRef<HTMLElement>(null)
  const [headerHeight, setHeaderHeight] = useState(0)

  useEffect(() => {
    const header = headerRef.current
    if (!header) return

    const updateHeight = (): void => {
      setHeaderHeight(header.offsetHeight)
    }

    updateHeight()

    const observer = new ResizeObserver(updateHeight)
    observer.observe(header)

    return () => observer.disconnect()
  }, [])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TrayNavigationSync onOpenProxy={setDetailsProxyId} />
      <Box
        ref={headerRef}
        component="header"
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: theme.zIndex.modal,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pb: 2,
          px: 2
        }}
      >
        {isWindows() && (
          <Box
            sx={{
              alignSelf: 'stretch',
              height: TITLE_BAR_HEIGHT,
              flexShrink: 0,
              bgcolor: palette.background.default,
              WebkitAppRegion: 'drag'
            }}
          />
        )}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pt: isWindows() ? 2 : 2.5,
            px: 0,
            alignSelf: 'stretch',
            bgcolor: withThemeAlpha(theme, palette.background.default, 0.72),
            backdropFilter: 'blur(20px) saturate(1.4)',
            WebkitBackdropFilter: 'blur(20px) saturate(1.4)'
          }}
        >
        <Box
          sx={{
            display: 'inline-flex',
            gap: 0.5,
            p: 0.5,
            borderRadius: 4,
            bgcolor: surfaceContainer(theme, 'low'),
            border: `1px solid ${withThemeAlpha(theme, palette.primary.main, 0.14)}`,
            boxShadow: elevationShadow(theme, 1),
            WebkitAppRegion: 'no-drag'
          }}
        >
          {NAV_ITEMS.map(({ path, labelKey, icon: Icon }) => {
            const isActive = activePath === path

            return (
              <Button
                key={path}
                component={Link}
                to={path}
                startIcon={
                  path === '/' && isCheckingAll ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <Icon sx={{ fontSize: 18 }} />
                  )
                }
                disableElevation
                sx={{
                  position: 'relative',
                  px: 2.5,
                  py: 1.1,
                  minWidth: 0,
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: isActive ? 'primary.main' : 'text.secondary',
                  bgcolor: isActive ? surfaceContainer(theme, 'high') : 'transparent',
                  boxShadow: isActive ? elevationShadow(theme, 1) : 'none',
                  transition: `all ${MD3_DURATION.short4}ms ${MD3_EASING.standard}`,
                  '&:hover': {
                    bgcolor: isActive
                      ? surfaceContainer(theme, 'highest')
                      : surfaceContainer(theme, 'low'),
                    transform: 'translateY(-1px)'
                  },
                  '& .MuiButton-startIcon': {
                    mr: 0.75,
                    ml: 0
                  }
                }}
              >
                {t(labelKey)}
                {path === '/' && (
                  <Box
                    component="span"
                    sx={{
                      ml: 1,
                      px: 0.85,
                      py: 0.15,
                      minWidth: 22,
                      borderRadius: 2,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      lineHeight: 1.4,
                      textAlign: 'center',
                      bgcolor: isActive ? 'primary.main' : surfaceContainer(theme, 'high'),
                      color: isActive ? 'primary.contrastText' : 'primary.main',
                      transition: `all ${MD3_DURATION.short4}ms ${MD3_EASING.standard}`
                    }}
                  >
                    {proxyCount}
                  </Box>
                )}
              </Button>
            )
          })}
        </Box>
        </Box>
      </Box>

      <Box aria-hidden sx={{ height: headerHeight, flexShrink: 0 }} />

      <Container
        component="main"
        maxWidth="lg"
        sx={{ flexGrow: 1, py: 2, pt: 1, position: 'relative', zIndex: 0 }}
      >
        <Box sx={{ overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
          <PageTransition />
        </Box>
      </Container>
    </Box>
  )
}

export default AppLayout
