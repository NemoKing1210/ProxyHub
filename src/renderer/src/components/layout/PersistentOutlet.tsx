import { AnimatePresence, motion, type Transition, type Variants } from 'framer-motion'
import { type ReactElement, useRef } from 'react'
import { useLocation, useOutlet } from 'react-router-dom'
import { MD3_DURATION } from '../../theme'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'

const enterTransition: Transition = {
  duration: MD3_DURATION.medium1 / 1000,
  ease: [0.05, 0.7, 0.1, 1]
}

const exitTransition: Transition = {
  duration: MD3_DURATION.short4 / 1000,
  ease: [0.3, 0, 0.8, 0.15]
}

const pageVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: enterTransition },
  exit: { opacity: 0, transition: exitTransition }
}

function PersistentOutlet(): React.JSX.Element {
  const location = useLocation()
  const outlet = useOutlet()
  const cacheRef = useRef<Map<string, ReactElement>>(new Map())
  const prefersReducedMotion = usePrefersReducedMotion()

  if (outlet && !cacheRef.current.has(location.pathname)) {
    cacheRef.current.set(location.pathname, outlet)
  }

  return (
    <AnimatePresence initial={false} mode="wait">
      {[...cacheRef.current.entries()].map(([pathname, cachedOutlet]) => {
        const isActive = pathname === location.pathname

        return isActive ? (
          <motion.div
            key={pathname}
            initial={prefersReducedMotion ? false : 'initial'}
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={prefersReducedMotion ? { duration: 0 } : enterTransition}
            style={{
              width: '100%',
              maxWidth: '100%',
              overflow: 'hidden'
            }}
          >
            {cachedOutlet}
          </motion.div>
        ) : null
      })}
    </AnimatePresence>
  )
}

export default PersistentOutlet
