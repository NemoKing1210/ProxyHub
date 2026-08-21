import { Box, Collapse, Container, LinearProgress, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMatch } from 'react-router-dom'
import { useProxyStore } from '../store/proxyStore'
import { elevationShadow, getPalette, MD3_DURATION, MD3_EASING, withThemeAlpha } from '../theme'
import { isWindows } from '../utils/platform'
import PageTransition from './PageTransition'
import AppNavigation from './AppNavigation'
import AppTitleBar from './AppTitleBar'
import SyncActivityIndicator from './SyncActivityIndicator'
import TrayNavigationSync from './TrayNavigationSync'

function AppLayout(): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const proxyCount = useProxyStore((state) => state.proxies.length)
  const isCheckingAll = useProxyStore((state) => state.isCheckingAll)
  const checkingIdsSize = useProxyStore((state) => state.checkingIds.size)
  const checkAllCompletedCount = useProxyStore((state) => {
    if (!state.isCheckingAll || state.checkingIds.size === 0) {
      return 0
    }

    let completed = 0

    for (const proxy of state.proxies) {
      if (state.checkingIds.has(proxy.id) && proxy.checkedAt) {
        completed += 1
      }
    }

    return completed
  })
  const isChecking = isCheckingAll || checkingIdsSize > 0
  const loadProxies = useProxyStore((state) => state.loadProxies)
  const isProxies = useMatch({ path: '/', end: true })
  const isSettings = useMatch({ path: '/settings/*' })

  const activePath = isProxies ? '/' : isSettings ? '/settings' : null
  const checkAllProgress = useMemo(() => {
    if (!isCheckingAll || checkingIdsSize === 0) {
      return null
    }

    return {
      completed: checkAllCompletedCount,
      total: checkingIdsSize,
      value: (checkAllCompletedCount / checkingIdsSize) * 100
    }
  }, [checkAllCompletedCount, checkingIdsSize, isCheckingAll])
  const checkProgressValue = useMemo(() => {
    if (checkAllProgress) {
      return checkAllProgress.value
    }

    if (!isChecking) {
      return 0
    }

    return undefined
  }, [checkAllProgress, isChecking])

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
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden'
      }}
    >
      <SyncActivityIndicator />
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
          alignItems: 'stretch',
          pb: isWindows() ? 0 : 2,
          px: isWindows() ? 0 : 2,
          bgcolor: palette.background.default
        }}
      >
        {isWindows() ? (
          <AppTitleBar
            activePath={activePath}
            proxyCount={proxyCount}
            isCheckingAll={isCheckingAll}
          />
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2.5 }}>
            <AppNavigation
              activePath={activePath}
              proxyCount={proxyCount}
              isCheckingAll={isCheckingAll}
            />
          </Box>
        )}

        <Box
          sx={{
            position: 'fixed',
            left: '50%',
            bottom: 'max(16px, env(safe-area-inset-bottom))',
            zIndex: theme.zIndex.snackbar,
            width: 'min(520px, calc(100vw - 32px))',
            transform: 'translateX(-50%)',
            pointerEvents: 'none'
          }}
        >
          <Collapse
            in={isChecking}
            unmountOnExit
            timeout={{ enter: MD3_DURATION.medium3, exit: MD3_DURATION.medium2 }}
          >
            <Box
              role="status"
              aria-label={
                checkAllProgress
                  ? t('nav.checkProgress', {
                      completed: checkAllProgress.completed,
                      total: checkAllProgress.total
                    })
                  : t('nav.checking')
              }
              sx={{
                mt: 1,
                px: 1.25,
                py: 1,
                borderRadius: '16px',
                bgcolor: withThemeAlpha(
                  theme,
                  palette.background.paper,
                  theme.palette.mode === 'dark' ? 0.42 : 0.72
                ),
                border: `1px solid ${withThemeAlpha(theme, palette.primary.main, 0.18)}`,
                boxShadow: elevationShadow(theme, 1),
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                pointerEvents: 'auto'
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: 1.5,
                  mb: 0.75
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    letterSpacing: '0.02em',
                    color: 'primary.main',
                    textTransform: 'uppercase',
                    fontSize: '0.68rem'
                  }}
                >
                  {t('nav.checking')}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
                  <Typography
                    component="span"
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      fontVariantNumeric: 'tabular-nums',
                      color: 'text.primary',
                      lineHeight: 1
                    }}
                  >
                    {checkAllProgress
                      ? `${checkAllProgress.completed} / ${checkAllProgress.total}`
                      : `0 / ${checkingIdsSize || 1}`}
                  </Typography>

                  {checkAllProgress && (
                    <Typography
                      component="span"
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.72rem',
                        fontVariantNumeric: 'tabular-nums',
                        color: 'text.secondary',
                        lineHeight: 1
                      }}
                    >
                      {Math.round(checkAllProgress.value)}%
                    </Typography>
                  )}
                </Box>
              </Box>

              <LinearProgress
                variant={checkProgressValue === undefined ? 'indeterminate' : 'determinate'}
                value={checkProgressValue}
                sx={{
                  height: 6,
                  borderRadius: '999px',
                  bgcolor: withThemeAlpha(theme, palette.primary.main, 0.14),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: '999px',
                    backgroundImage: `linear-gradient(90deg, ${palette.primary.dark}, ${palette.primary.main}, ${palette.primary.light})`,
                    transition: `transform ${MD3_DURATION.medium2}ms ${MD3_EASING.standard}`
                  }
                }}
              />
            </Box>
          </Collapse>
        </Box>
      </Box>

      <Box aria-hidden sx={{ height: headerHeight, flexShrink: 0 }} />

      <Box
        data-app-scroll-container
        sx={{
          flex: 1,
          minHeight: 0,
          overflowX: 'hidden',
          overflowY: 'auto',
          scrollbarGutter: 'stable'
        }}
      >
        <Container
          component="main"
          maxWidth="lg"
          sx={{ py: 2, pt: 1, position: 'relative', zIndex: 0 }}
        >
          <Box sx={{ overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
            <PageTransition />
          </Box>
        </Container>
      </Box>
    </Box>
  )
}

export default AppLayout
