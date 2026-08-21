import { useCallback, useLayoutEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

function getScrollContainer(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-app-scroll-container]')
}

export function usePageScrollRestoration(): {
  restoreScroll: (pathname: string) => void
} {
  const location = useLocation()
  const scrollPositionsRef = useRef<Record<string, number>>({})
  const previousPathRef = useRef(location.pathname)

  useLayoutEffect(() => {
    const previousPath = previousPathRef.current

    if (previousPath !== location.pathname) {
      const scrollContainer = getScrollContainer()
      scrollPositionsRef.current[previousPath] = scrollContainer?.scrollTop ?? window.scrollY
      previousPathRef.current = location.pathname

      if (scrollContainer) {
        scrollContainer.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      } else {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      }
    }
  }, [location.pathname])

  const restoreScroll = useCallback((pathname: string): void => {
    const savedPosition = scrollPositionsRef.current[pathname]
    if (savedPosition === undefined) return

    const scrollContainer = getScrollContainer()

    if (scrollContainer) {
      scrollContainer.scrollTo({ top: savedPosition, left: 0, behavior: 'instant' })
    } else {
      window.scrollTo({
        top: savedPosition,
        left: 0,
        behavior: 'instant'
      })
    }
  }, [])

  return { restoreScroll }
}
