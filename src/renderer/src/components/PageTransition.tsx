import { Box } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useEffect, useMemo, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

const ROUTE_ORDER = ['/', '/settings'] as const

type SlideDirection = 'from-left' | 'from-right' | 'fade'

function resolveSlideDirection(
  from: string,
  to: string,
  isRtl: boolean
): SlideDirection {
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
  const prevPathRef = useRef(location.pathname)

  const slideDirection = useMemo(
    () => resolveSlideDirection(prevPathRef.current, location.pathname, theme.direction === 'rtl'),
    [location.pathname, theme.direction]
  )

  useEffect(() => {
    prevPathRef.current = location.pathname
  }, [location.pathname])

  const animationName =
    slideDirection === 'from-right'
      ? 'pageEnterFromRight'
      : slideDirection === 'from-left'
        ? 'pageEnterFromLeft'
        : 'pageEnterFade'

  return (
    <Box
      key={location.pathname}
      sx={{
        animation: `${animationName} 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards`,
        '@media (prefers-reduced-motion: reduce)': {
          animation: 'none'
        },
        '@keyframes pageEnterFromRight': {
          from: {
            opacity: 0,
            transform: 'translateX(24px) translateY(8px)'
          },
          to: {
            opacity: 1,
            transform: 'translateX(0) translateY(0)'
          }
        },
        '@keyframes pageEnterFromLeft': {
          from: {
            opacity: 0,
            transform: 'translateX(-24px) translateY(8px)'
          },
          to: {
            opacity: 1,
            transform: 'translateX(0) translateY(0)'
          }
        },
        '@keyframes pageEnterFade': {
          from: {
            opacity: 0,
            transform: 'translateY(10px)'
          },
          to: {
            opacity: 1,
            transform: 'translateY(0)'
          }
        }
      }}
    >
      <Outlet />
    </Box>
  )
}

export default PageTransition
