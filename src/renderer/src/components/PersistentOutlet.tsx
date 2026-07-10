import { Box } from '@mui/material'
import { type ReactElement, useLayoutEffect, useRef } from 'react'
import { useLocation, useOutlet } from 'react-router-dom'

interface PersistentOutletProps {
  activePageSx?: Record<string, unknown>
  animationKey: number
  onAnimationEnd?: () => void
}

function PersistentOutlet({
  activePageSx,
  animationKey,
  onAnimationEnd
}: PersistentOutletProps): React.JSX.Element {
  const location = useLocation()
  const outlet = useOutlet()
  const cacheRef = useRef<Map<string, ReactElement>>(new Map())
  const activeRef = useRef<HTMLDivElement>(null)

  if (outlet) {
    cacheRef.current.set(location.pathname, outlet)
  }

  useLayoutEffect(() => {
    if (!activeRef.current || animationKey === 0) return

    const node = activeRef.current
    node.style.animation = 'none'
    void node.offsetHeight
    node.style.removeProperty('animation')
  }, [animationKey, location.pathname])

  return (
    <>
      {[...cacheRef.current.entries()].map(([pathname, cachedOutlet]) => {
        const isActive = pathname === location.pathname

        return (
          <Box
            key={pathname}
            ref={isActive ? activeRef : undefined}
            onAnimationEnd={
              isActive
                ? (event) => {
                    if (event.target !== event.currentTarget) return
                    onAnimationEnd?.()
                  }
                : undefined
            }
            sx={{
              display: isActive ? 'block' : 'none',
              overflow: 'hidden',
              width: '100%',
              maxWidth: '100%',
              ...(isActive ? activePageSx : undefined)
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
