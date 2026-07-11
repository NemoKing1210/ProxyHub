import { Box } from '@mui/material'
import { type ReactElement, useRef } from 'react'
import { useLocation, useOutlet } from 'react-router-dom'

function PersistentOutlet(): React.JSX.Element {
  const location = useLocation()
  const outlet = useOutlet()
  const cacheRef = useRef<Map<string, ReactElement>>(new Map())

  if (outlet && !cacheRef.current.has(location.pathname)) {
    cacheRef.current.set(location.pathname, outlet)
  }

  return (
    <>
      {[...cacheRef.current.entries()].map(([pathname, cachedOutlet]) => {
        const isActive = pathname === location.pathname

        return (
          <Box
            key={pathname}
            sx={{
              display: isActive ? 'block' : 'none',
              overflow: 'hidden',
              width: '100%',
              maxWidth: '100%'
            }}
          >
            {cachedOutlet}
          </Box>
        )
      })}
    </>
  )
}

export default PersistentOutlet
