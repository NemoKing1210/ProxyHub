import { Box } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { MD3_DURATION, MD3_EASING } from '../theme'

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
  const [transition, setTransition] = useState({
    path: location.pathname,
    direction: 'fade' as SlideDirection
  })

  if (location.pathname !== transition.path) {
    const direction = resolveSlideDirection(
      transition.path,
      location.pathname,
      theme.direction === 'rtl'
    )
    setTransition({ path: location.pathname, direction })
  }

  const animationName =
    transition.direction === 'from-right'
      ? 'pageEnterFromRight'
      : transition.direction === 'from-left'
        ? 'pageEnterFromLeft'
        : 'pageEnterFade'

  const duration = MD3_DURATION.medium3
  const easing = MD3_EASING.emphasizedDecelerate

  return (
    <Box
      key={location.pathname}
      sx={{
        animation: `${animationName} ${duration}ms ${easing} forwards`,
        '@media (prefers-reduced-motion: reduce)': {
          animation: 'none'
        },
        '@keyframes pageEnterFromRight': {
          from: {
            opacity: 0,
            transform: 'translateX(32px) translateY(12px) scale(0.98)'
          },
          to: {
            opacity: 1,
            transform: 'translateX(0) translateY(0) scale(1)'
          }
        },
        '@keyframes pageEnterFromLeft': {
          from: {
            opacity: 0,
            transform: 'translateX(-32px) translateY(12px) scale(0.98)'
          },
          to: {
            opacity: 1,
            transform: 'translateX(0) translateY(0) scale(1)'
          }
        },
        '@keyframes pageEnterFade': {
          from: {
            opacity: 0,
            transform: 'translateY(16px) scale(0.99)'
          },
          to: {
            opacity: 1,
            transform: 'translateY(0) scale(1)'
          }
        }
      }}
    >
      <Outlet />
    </Box>
  )
}

export default PageTransition
