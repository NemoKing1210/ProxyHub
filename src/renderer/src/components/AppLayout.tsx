import NetworkCheckIcon from '@mui/icons-material/NetworkCheck'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import {
  AppBar,
  Box,
  Button,
  Container,
  IconButton,
  Toolbar,
  Tooltip,
  Typography
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { Link, Outlet, useMatch } from 'react-router-dom'

function AppLayout(): React.JSX.Element {
  const { t } = useTranslation()
  const isProxies = useMatch({ path: '/', end: true })
  const isSettings = useMatch({ path: '/settings', end: true })

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <NetworkCheckIcon sx={{ mr: 1.5 }} />
          <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }}>
            {t('app.title')}
          </Typography>

          <Button
            component={Link}
            to="/"
            color="inherit"
            sx={{ mr: 1, ...(isProxies ? { bgcolor: 'action.selected' } : {}) }}
          >
            {t('nav.proxies')}
          </Button>

          <Tooltip title={t('nav.settings')}>
            <IconButton
              component={Link}
              to="/settings"
              color="inherit"
              sx={isSettings ? { bgcolor: 'action.selected' } : undefined}
            >
              <SettingsOutlinedIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Container component="main" maxWidth="lg" sx={{ flexGrow: 1, py: 4 }}>
        <Outlet />
      </Container>
    </Box>
  )
}

export default AppLayout
