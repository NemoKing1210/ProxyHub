import CloudOutlinedIcon from '@mui/icons-material/CloudOutlined'
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined'
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined'
import FlightTakeoffOutlinedIcon from '@mui/icons-material/FlightTakeoffOutlined'
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined'
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined'
import RouterOutlinedIcon from '@mui/icons-material/RouterOutlined'
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined'
import StarBorderOutlinedIcon from '@mui/icons-material/StarBorderOutlined'
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined'
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined'
import WorkOutlineOutlinedIcon from '@mui/icons-material/WorkOutlineOutlined'
import type { SvgIconProps } from '@mui/material'
import { DEFAULT_PROXY_ICON_ID, type ProxyIconId } from '@shared/types/proxy'
import { resolveProxyIconId } from '@shared/utils/proxy-icons'

const ICON_COMPONENTS: Record<ProxyIconId, typeof RouterOutlinedIcon> = {
  router: RouterOutlinedIcon,
  dns: DnsOutlinedIcon,
  cloud: CloudOutlinedIcon,
  public: PublicOutlinedIcon,
  shield: ShieldOutlinedIcon,
  vpn: VpnKeyOutlinedIcon,
  storage: StorageOutlinedIcon,
  home: HomeOutlinedIcon,
  work: WorkOutlineOutlinedIcon,
  travel: FlightTakeoffOutlinedIcon,
  star: StarBorderOutlinedIcon,
  favorite: FavoriteBorderOutlinedIcon
}

interface ProxyIconProps extends SvgIconProps {
  iconId?: ProxyIconId
}

function ProxyIcon({ iconId, ...props }: ProxyIconProps): React.JSX.Element {
  const resolvedId = resolveProxyIconId(iconId)
  const Icon = ICON_COMPONENTS[resolvedId] ?? ICON_COMPONENTS[DEFAULT_PROXY_ICON_ID]

  return <Icon {...props} />
}

export default ProxyIcon
