import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined'
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined'
import StarIcon from '@mui/icons-material/Star'
import ToggleOnOutlinedIcon from '@mui/icons-material/ToggleOnOutlined'
import { Chip, Stack } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import { useTheme } from '@mui/material/styles'
import { useMemo, type ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import type { Proxy } from '@shared/types/proxy'
import { isProxyEnabled } from '@shared/utils/proxy-enabled'
import { getPalette, surfaceContainer, withThemeAlpha } from '../../theme'
import type { ProxyGroupBadgeFilter } from '../../utils/proxy-group-badge-filter'
import {
  isProxyGroupBadgeFilterActive,
  toggleProxyGroupBadgeFilter
} from '../../utils/proxy-group-badge-filter'
import {
  badgeTransition,
  listLayoutTransition,
  statBadgeVariants,
  usePrefersReducedMotion
} from '../../utils/list-motion'
import { AnimatePresence, motion } from 'framer-motion'

interface StatBadgeItem {
  key: string
  icon: ReactElement
  label: string
  sx: SxProps<Theme>
  activeSx: SxProps<Theme>
}

interface ProxyStatBadgesProps {
  proxies: Proxy[]
  animated?: boolean
  clickable?: boolean
  activeFilter?: ProxyGroupBadgeFilter | null
  onFilterChange?: (filter: ProxyGroupBadgeFilter | null) => void
  sx?: SxProps<Theme>
}

function ProxyStatBadges({
  proxies,
  animated = false,
  clickable = false,
  activeFilter = null,
  onFilterChange,
  sx
}: ProxyStatBadgesProps): React.JSX.Element | null {
  const { t } = useTranslation()
  const theme = useTheme()
  const palette = getPalette(theme)
  const reducedMotion = usePrefersReducedMotion()

  const statBadgeSx = {
    fontWeight: 700,
    border: 'none',
    '& .MuiChip-icon': {
      fontSize: 16,
      ml: 0.75
    },
    '& .MuiChip-label': {
      px: 1
    }
  }

  const statBadges = useMemo((): StatBadgeItem[] => {
    const aliveCount = proxies.filter((proxy) => proxy.status === 'alive').length
    const deadCount = proxies.filter((proxy) => proxy.status === 'dead').length
    const enabledCount = proxies.filter(isProxyEnabled).length
    const favoritesCount = proxies.filter((proxy) => proxy.isFavorite).length
    const badges: StatBadgeItem[] = []

    if (proxies.length > 0) {
      badges.push({
        key: 'total',
        icon: <DnsOutlinedIcon />,
        label: t('proxyList.statsTotal', { count: proxies.length }),
        sx: {
          ...statBadgeSx,
          bgcolor: surfaceContainer(theme, 'default'),
          color: 'text.primary',
          '& .MuiChip-icon': {
            ...statBadgeSx['& .MuiChip-icon'],
            color: 'primary.main'
          }
        },
        activeSx: {
          boxShadow: `inset 0 0 0 2px ${withThemeAlpha(theme, palette.primary.main, 0.55)}`,
          bgcolor: surfaceContainer(theme, 'high')
        }
      })
    }

    if (aliveCount > 0) {
      badges.push({
        key: 'alive',
        icon: <CheckCircleOutlinedIcon />,
        label: t('proxyList.statsAlive', { count: aliveCount }),
        sx: {
          ...statBadgeSx,
          bgcolor: withThemeAlpha(theme, palette.success.main, 0.14),
          color: palette.success.main,
          '& .MuiChip-icon': {
            ...statBadgeSx['& .MuiChip-icon'],
            color: palette.success.main
          }
        },
        activeSx: {
          boxShadow: `inset 0 0 0 2px ${withThemeAlpha(theme, palette.success.main, 0.55)}`,
          bgcolor: withThemeAlpha(theme, palette.success.main, 0.24)
        }
      })
    }

    if (deadCount > 0) {
      badges.push({
        key: 'dead',
        icon: <ErrorOutlineOutlinedIcon />,
        label: t('proxyList.statsDead', { count: deadCount }),
        sx: {
          ...statBadgeSx,
          bgcolor: withThemeAlpha(theme, palette.error.main, 0.14),
          color: palette.error.main,
          '& .MuiChip-icon': {
            ...statBadgeSx['& .MuiChip-icon'],
            color: palette.error.main
          }
        },
        activeSx: {
          boxShadow: `inset 0 0 0 2px ${withThemeAlpha(theme, palette.error.main, 0.55)}`,
          bgcolor: withThemeAlpha(theme, palette.error.main, 0.24)
        }
      })
    }

    if (enabledCount > 0) {
      badges.push({
        key: 'enabled',
        icon: <ToggleOnOutlinedIcon />,
        label: t('proxyList.statsEnabled', { count: enabledCount }),
        sx: {
          ...statBadgeSx,
          bgcolor: withThemeAlpha(theme, palette.primary.main, 0.14),
          color: palette.primary.main,
          '& .MuiChip-icon': {
            ...statBadgeSx['& .MuiChip-icon'],
            color: palette.primary.main
          }
        },
        activeSx: {
          boxShadow: `inset 0 0 0 2px ${withThemeAlpha(theme, palette.primary.main, 0.55)}`,
          bgcolor: withThemeAlpha(theme, palette.primary.main, 0.24)
        }
      })
    }

    if (favoritesCount > 0) {
      badges.push({
        key: 'favorites',
        icon: <StarIcon />,
        label: t('proxyList.statsFavorites', { count: favoritesCount }),
        sx: {
          ...statBadgeSx,
          bgcolor: withThemeAlpha(theme, palette.warning.main, 0.14),
          color: palette.warning.main,
          '& .MuiChip-icon': {
            ...statBadgeSx['& .MuiChip-icon'],
            color: palette.warning.main
          }
        },
        activeSx: {
          boxShadow: `inset 0 0 0 2px ${withThemeAlpha(theme, palette.warning.main, 0.55)}`,
          bgcolor: withThemeAlpha(theme, palette.warning.main, 0.24)
        }
      })
    }

    return badges
  }, [
    palette.error.main,
    palette.primary.main,
    palette.success.main,
    palette.warning.main,
    proxies,
    t,
    theme
  ])

  if (statBadges.length === 0) {
    return null
  }

  const chips = statBadges.map((badge) => {
    const isActive = clickable && isProxyGroupBadgeFilterActive(activeFilter, badge.key)
    const chip = (
      <Chip
        icon={badge.icon}
        label={badge.label}
        size="small"
        clickable={clickable}
        aria-pressed={clickable ? isActive : undefined}
        onClick={
          clickable && onFilterChange
            ? (event) => {
                event.stopPropagation()
                onFilterChange(toggleProxyGroupBadgeFilter(activeFilter, badge.key))
              }
            : undefined
        }
        sx={
          [
            badge.sx,
            isActive ? badge.activeSx : null,
            clickable
              ? {
                  cursor: 'pointer',
                  '&:hover': {
                    filter: 'brightness(1.06)'
                  }
                }
              : null
          ] as SxProps<Theme>
        }
      />
    )

    if (!animated) {
      return (
        <span key={badge.key} style={{ display: 'inline-flex' }}>
          {chip}
        </span>
      )
    }

    return (
      <motion.div
        key={badge.key}
        layout={!reducedMotion}
        variants={reducedMotion ? undefined : statBadgeVariants}
        initial={reducedMotion ? false : 'initial'}
        animate={reducedMotion ? undefined : 'animate'}
        exit={reducedMotion ? undefined : 'exit'}
        transition={
          reducedMotion ? { duration: 0 } : { layout: listLayoutTransition, ...badgeTransition }
        }
      >
        {chip}
      </motion.div>
    )
  })

  return (
    <Stack
      direction="row"
      spacing={0.75}
      component={animated ? motion.div : 'div'}
      {...(animated
        ? {
            layout: !reducedMotion
          }
        : {})}
      sx={{ flexWrap: 'wrap', gap: 0.75, mt: 0.75, ...sx }}
    >
      {animated ? <AnimatePresence mode="popLayout">{chips}</AnimatePresence> : chips}
    </Stack>
  )
}

export default ProxyStatBadges
