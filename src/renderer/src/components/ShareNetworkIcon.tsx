import type { IconType } from 'react-icons'
import { FaLinkedinIn } from 'react-icons/fa6'
import {
  SiFacebook,
  SiLine,
  SiOdnoklassniki,
  SiReddit,
  SiTelegram,
  SiViber,
  SiVk,
  SiWhatsapp,
  SiX
} from 'react-icons/si'
import type { ShareChannelNetwork } from '../utils/proxy-share-channels'

type SocialNetwork = Exclude<ShareChannelNetwork, 'email' | 'system'>

const SOCIAL_ICONS: Record<SocialNetwork, IconType> = {
  telegram: SiTelegram,
  whatsapp: SiWhatsapp,
  viber: SiViber,
  vk: SiVk,
  ok: SiOdnoklassniki,
  facebook: SiFacebook,
  x: SiX,
  linkedin: FaLinkedinIn,
  reddit: SiReddit,
  line: SiLine
}

interface ShareNetworkIconProps {
  network: SocialNetwork
}

function ShareNetworkIcon({ network }: ShareNetworkIconProps): React.JSX.Element {
  const Icon = SOCIAL_ICONS[network]

  return <Icon size={22} aria-hidden />
}

export default ShareNetworkIcon
