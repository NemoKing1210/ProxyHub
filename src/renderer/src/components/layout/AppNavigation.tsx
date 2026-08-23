import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined'
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import { Box, Button, CircularProgress } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  elevationShadow,
  getPalette,
  MD3_DURATION,
  MD3_EASING,
  surfaceContainer,
  withThemeAlpha
} from '../../theme'

const NAV_ITEMS = [
  { path: '/', labelKey: 'nav.proxies', icon: DnsOutlinedIcon },
  { path: '/providers', labelKey: 'nav.providers', icon: LanguageOutlinedIcon },
  { path: '/settings', labelKey: 'nav.settings', icon: SettingsOutlinedIcon }
] as const

interface AppNavigationProps {
  activePath: string | null
  proxyCount: number
  isCheckingAll: boolean
  compact?: boolean
}

function AppNavigation({
  activePath,
  proxyCount,
  isCheckingAll,
  compact = false
}: AppNavigationProps): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const palette = getPalette(theme)

  return (
    <Box
      sx={{
        display: 'inline-flex',
        gap: 0.25,
        p: compact ? 0.35 : 0.5,
        flexShrink: 0,
        borderRadius: '16px',
        bgcolor: surfaceContainer(theme, 'low'),
        border: `1px solid ${withThemeAlpha(theme, palette.primary.main, compact ? 0.12 : 0.14)}`,
        boxShadow: compact ? 'none' : elevationShadow(theme, 1),
        backdropFilter: compact ? 'none' : 'blur(10px)',
        WebkitBackdropFilter: compact ? 'none' : 'blur(10px)',
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
              px: compact ? 1.75 : 2.5,
              py: compact ? 0.65 : 1.1,
              minWidth: 0,
              borderRadius: '16px',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: compact ? '0.84rem' : '0.875rem',
              lineHeight: 1.35,
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
                mr: compact ? 0.75 : 0.75,
                ml: 0
              }
            }}
          >
            {t(labelKey)}
            {path === '/' && proxyCount > 0 && (
              <Box
                component="span"
                sx={{
                  ml: compact ? 0.85 : 1,
                  px: compact ? 0.7 : 0.85,
                  py: 0.12,
                  minWidth: compact ? 21 : 22,
                  borderRadius: '12px',
                  fontSize: compact ? '0.68rem' : '0.7rem',
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
  )
}

export default AppNavigation
