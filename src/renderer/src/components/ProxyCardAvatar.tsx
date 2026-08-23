import { DEFAULT_PROXY_ICON_ID, type ProxyIconId } from '@shared/types/proxy'
import CountryFlag from './CountryFlag'
import ProxyIcon from './ProxyIcon'

interface ProxyCardAvatarProps {
  icon?: ProxyIconId
  countryCode?: string
  flagSize?: number
  fontSize?: 'small' | 'medium' | 'large' | 'inherit'
}

function ProxyCardAvatar({
  icon,
  countryCode,
  flagSize = 22,
  fontSize = 'small'
}: ProxyCardAvatarProps): React.JSX.Element {
  if (icon !== undefined) {
    return <ProxyIcon iconId={icon} fontSize={fontSize} />
  }

  if (countryCode) {
    return <CountryFlag countryCode={countryCode} size={flagSize} />
  }

  return <ProxyIcon iconId={DEFAULT_PROXY_ICON_ID} fontSize={fontSize} />
}

export default ProxyCardAvatar
