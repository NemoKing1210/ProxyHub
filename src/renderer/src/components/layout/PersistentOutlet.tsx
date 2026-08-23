import { type ReactElement, useRef } from 'react'
import { Box, useTheme } from '@mui/material'
import { useLocation, useOutlet } from 'react-router-dom'
import { getPalette } from '../../theme'

/**
 * Renders the active page while keeping previously visited pages mounted in
 * a cache, so their state and scroll position survive navigation.
 */
function PersistentOutlet(): React.JSX.Element {
  const location = useLocation()
  const outlet = useOutlet()
  const cacheRef = useRef<Map<string, ReactElement>>(new Map())

  if (outlet && !cacheRef.current.has(location.pathname)) {
    cacheRef.current.set(location.pathname, outlet)
  }

  const theme = useTheme()
  // theme.vars: in CSS-var themes the static theme.palette holds light values.
  const pageBackground = getPalette(theme).background.default

  return (
    <Box sx={{ position: 'relative', width: '100%', maxWidth: '100%' }}>
      {[...cacheRef.current.entries()].map(([pathname, cachedOutlet]) => {
        const isActive = pathname === location.pathname

        return (
          <Box
            key={pathname}
            sx={{
              display: isActive ? 'block' : 'none',
              width: '100%',
              maxWidth: '100%',
              overflow: 'hidden',
              bgcolor: isActive ? pageBackground : 'transparent'
            }}
          >
            {cachedOutlet}
          </Box>
        )
      })}
    </Box>
  )
}

export default PersistentOutlet
