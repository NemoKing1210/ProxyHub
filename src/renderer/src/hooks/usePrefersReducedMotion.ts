import { useMediaQuery } from '@mui/material'

/** Учитывает системную настройку «уменьшить движение». */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}
