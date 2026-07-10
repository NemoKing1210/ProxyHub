import { alpha, type Theme } from '@mui/material/styles'
import { PROXY_COLOR_VALUES } from '../../../shared/constants/proxy-colors'
import type { ProxyColorId } from '../../../shared/types/proxy'
import { resolveProxyColorId } from '../../../shared/utils/proxy-colors'

export interface ProxyColorStyles {
  id: ProxyColorId
  main: string
  background: string
  ring: string
}

export function getProxyColorStyles(
  theme: Theme,
  colorId?: string | ProxyColorId
): ProxyColorStyles {
  const id = resolveProxyColorId(colorId)
  const main = PROXY_COLOR_VALUES[id]
  const backgroundOpacity = theme.palette.mode === 'dark' ? 0.24 : 0.14

  return {
    id,
    main,
    background: alpha(main, backgroundOpacity),
    ring: alpha(main, 0.35)
  }
}
