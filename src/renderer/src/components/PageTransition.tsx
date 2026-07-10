import { Box } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { usePageScrollRestoration } from '../hooks/usePageScrollRestoration'
import { MD3_DURATION, MD3_EASING } from '../theme'
import PersistentOutlet from './PersistentOutlet'

const ROUTE_ORDER = ['/', '/settings'] as const

type SlideDirection = 'from-left' | 'from-right' | 'fade'

function resolveSlideDirection(from: string, to: string, isRtl: boolean): SlideDirection {
  const fromIndex = ROUTE_ORDER.indexOf(from as (typeof ROUTE_ORDER)[number])
  const toIndex = ROUTE_ORDER.indexOf(to as (typeof ROUTE_ORDER)[number])

  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    return 'fade'
  }

  const forward = toIndex > fromIndex
  const slideFromRight = isRtl ? !forward : forward

  return slideFromRight ? 'from-right' : 'from-left'
}

function PageTransition(): React.JSX.Element {
  const location = useLocation()
  const theme = useTheme()
  const navigationKeyRef = useRef(0)
  const { restoreScroll } = usePageScrollRestoration()
  const [transition, setTransition] = useState({
    path: location.pathname,
    direction: 'fade' as SlideDirection,
    key: 0
  })

  if (location.pathname !== transition.path) {
    const direction = resolveSlideDirection(
      transition.path,
      location.pathname,
      theme.direction === 'rtl'
    )
    navigationKeyRef.current += 1
    setTransition({ path: location.pathname, direction, key: navigationKeyRef.current })
  }

  const animationName =
    transition.direction === 'from-right'
      ? 'pageEnterFromRight'
      : transition.direction === 'from-left'
        ? 'pageEnterFromLeft'
        : 'pageEnterFade'

  const duration = MD3_DURATION.medium3
  const easing = MD3_EASING.emphasizedDecelerate
  const shouldAnimate = transition.key > 0

  useEffect(() => {
    if (transition.key === 0) return

    const timeoutId = window.setTimeout(() => {
      restoreScroll(location.pathname)
    }, duration + 50)

    return () => window.clearTimeout(timeoutId)
  }, [transition.key, location.pathname, duration, restoreScroll])

  const handleAnimationEnd = (): void => {
    restoreScroll(location.pathname)
  }

  const activePageSx = shouldAnimate
    ? {
        animation: `${animationName} ${duration}ms ${easing} forwards`,
        willChange: 'transform, opacity',
        '@media (prefers-reduced-motion: reduce)': {
          animation: 'none',
          willChange: 'auto'
        },
        '@keyframes pageEnterFromRight': {
          from: {
            opacity: 0,
            transform: 'translateX(32px) scale(0.98)'
          },
          to: {
            opacity: 1,
            transform: 'translateX(0) scale(1)'
          }
        },
        '@keyframes pageEnterFromLeft': {
          from: {
            opacity: 0,
            transform: 'translateX(-32px) scale(0.98)'
          },
          to: {
            opacity: 1,
            transform: 'translateX(0) scale(1)'
          }
        },
        '@keyframes pageEnterFade': {
          from: {
            opacity: 0,
            transform: 'scale(0.99)'
          },
          to: {
            opacity: 1,
            transform: 'scale(1)'
          }
        }
      }
    : undefined

  return (
    <Box sx={{ overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
      <PersistentOutlet
        activePageSx={activePageSx}
        animationKey={transition.key}
        onAnimationEnd={handleAnimationEnd}
      />
    </Box>
  )
}

export default PageTransition
