import { useCallback, useLayoutEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

export function usePageScrollRestoration(): {
  restoreScroll: (pathname: string) => void
} {
  const location = useLocation()
  const scrollPositionsRef = useRef<Record<string, number>>({})
  const previousPathRef = useRef(location.pathname)

  useLayoutEffect(() => {
    const previousPath = previousPathRef.current

    if (previousPath !== location.pathname) {
      scrollPositionsRef.current[previousPath] = window.scrollY
      previousPathRef.current = location.pathname
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    }
  }, [location.pathname])

  const restoreScroll = useCallback((pathname: string): void => {
    window.scrollTo({
      top: scrollPositionsRef.current[pathname] ?? 0,
      left: 0,
      behavior: 'instant'
    })
  }, [])

  return { restoreScroll }
}
