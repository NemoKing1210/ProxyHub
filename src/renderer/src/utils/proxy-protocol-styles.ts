import { alpha, type Theme } from '@mui/material/styles'
import { PROXY_COLOR_VALUES } from '../../../shared/constants/proxy-colors'
import type { ProxyProtocol } from '../../../shared/types/proxy'

const PROTOCOL_COLORS: Record<ProxyProtocol, string> = {
  http: PROXY_COLOR_VALUES.blue,
  https: PROXY_COLOR_VALUES.green,
  socks4: PROXY_COLOR_VALUES.orange,
  socks5: PROXY_COLOR_VALUES.purple
}

export interface ProxyProtocolStyles {
  main: string
  background: string
}

export function getProxyProtocolStyles(
  theme: Theme,
  protocol: ProxyProtocol
): ProxyProtocolStyles {
  const main = PROTOCOL_COLORS[protocol]
  const backgroundOpacity = theme.palette.mode === 'dark' ? 0.28 : 0.14

  return {
    main,
    background: alpha(main, backgroundOpacity)
  }
}
