import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import { Box, Button, Container } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useMatch } from 'react-router-dom'
import { useProxyStore } from '../store/proxyStore'
import PageTransition from './PageTransition'

const NAV_ITEMS = [
  { path: '/', labelKey: 'nav.proxies', icon: DnsOutlinedIcon, end: true },
  { path: '/settings', labelKey: 'nav.settings', icon: SettingsOutlinedIcon, end: true }
] as const

function AppLayout(): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const proxyCount = useProxyStore((state) => state.proxies.length)
  const loadProxies = useProxyStore((state) => state.loadProxies)
  const isProxies = useMatch({ path: '/', end: true })
  const isSettings = useMatch({ path: '/settings', end: true })

  const activePath = isProxies ? '/' : isSettings ? '/settings' : null

  useEffect(() => {
    void loadProxies()
  }, [loadProxies])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Box
        component="header"
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: theme.zIndex.appBar,
          display: 'flex',
          justifyContent: 'center',
          pt: 3,
          pb: 2,
          px: 2,
          bgcolor: alpha(theme.palette.background.default, 0.88),
          backdropFilter: 'blur(12px)'
        }}
      >
        <Box
          sx={{
            display: 'inline-flex',
            gap: 0.5,
            p: 0.5,
            borderRadius: 3,
            bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.08 : 0.05),
            border: 1,
            borderColor: alpha(theme.palette.primary.main, 0.12)
          }}
        >
          {NAV_ITEMS.map(({ path, labelKey, icon: Icon }) => {
            const isActive = activePath === path

            return (
              <Button
                key={path}
                component={Link}
                to={path}
                startIcon={<Icon sx={{ fontSize: 18 }} />}
                disableElevation
                sx={{
                  px: 2.5,
                  py: 1,
                  minWidth: 0,
                  borderRadius: 2.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: isActive ? 'primary.main' : 'text.secondary',
                  bgcolor: isActive
                    ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.18 : 0.12)
                    : 'transparent',
                  boxShadow: isActive
                    ? `0 1px 3px ${alpha(theme.palette.primary.main, 0.2)}`
                    : 'none',
                  '&:hover': {
                    bgcolor: isActive
                      ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.22 : 0.16)
                      : alpha(theme.palette.primary.main, 0.08)
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
                      px: 0.75,
                      py: 0.125,
                      minWidth: 20,
                      borderRadius: 1.25,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      lineHeight: 1.4,
                      textAlign: 'center',
                      bgcolor: isActive
                        ? 'primary.main'
                        : alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.14),
                      color: isActive ? 'primary.contrastText' : 'primary.main'
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

      <Container
        component="main"
        maxWidth="lg"
        sx={{ flexGrow: 1, py: 2, pt: 0, overflowX: 'hidden' }}
      >
        <PageTransition />
      </Container>
    </Box>
  )
}

export default AppLayout
