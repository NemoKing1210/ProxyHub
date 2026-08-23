import type { Transition, Variants } from 'framer-motion'
import { MD3_DURATION } from '../theme'

const emphasizedDecelerate = [0.05, 0.7, 0.1, 1] as const

export const listLayoutTransition: Transition = {
  duration: MD3_DURATION.medium4 / 1000,
  ease: emphasizedDecelerate
}

export const listItemTransition: Transition = {
  duration: MD3_DURATION.medium3 / 1000,
  ease: emphasizedDecelerate
}

export const badgeTransition: Transition = {
  duration: MD3_DURATION.medium2 / 1000,
  ease: emphasizedDecelerate
}

export const statBadgeVariants: Variants = {
  initial: { opacity: 0, scale: 0.88, y: 6 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.88, y: -4 }
}

export const proxyCardVariants: Variants = {
  initial: { opacity: 0, y: 16, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -12, scale: 0.985 }
}
