import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined'
import { Box } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { ProxyGroup } from '@shared/types/proxy-group'
import { getGroupColorStyles } from '../utils/proxy-group-appearance'
import ProxyIcon from './ProxyIcon'

interface ProxyGroupAvatarProps {
  group: Pick<ProxyGroup, 'icon' | 'color'>
  size?: number
  iconSize?: number
}

function ProxyGroupAvatar({
  group,
  size = 36,
  iconSize = 20
}: ProxyGroupAvatarProps): React.JSX.Element {
  const theme = useTheme()
  const colorStyles = getGroupColorStyles(theme, group.color)

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: '12px',
        flexShrink: 0,
        bgcolor: colorStyles.accent,
        color: colorStyles.main,
        boxShadow: `inset 0 0 0 1px ${colorStyles.ring}`
      }}
    >
      {group.icon ? (
        <ProxyIcon iconId={group.icon} sx={{ fontSize: iconSize }} />
      ) : (
        <FolderOutlinedIcon sx={{ fontSize: iconSize }} />
      )}
    </Box>
  )
}

export default ProxyGroupAvatar
