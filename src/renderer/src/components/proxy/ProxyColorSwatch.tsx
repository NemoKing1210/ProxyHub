import { Box } from '@mui/material'
import { PROXY_COLOR_VALUES } from '@shared/constants/proxy-colors'
import type { ProxyColorId } from '@shared/types/proxy'

interface ProxyColorSwatchProps {
  colorId: ProxyColorId
  size?: number
}

function ProxyColorSwatch({ colorId, size = 20 }: ProxyColorSwatchProps): React.JSX.Element {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        flexShrink: 0,
        bgcolor: PROXY_COLOR_VALUES[colorId]
      }}
    />
  )
}

export default ProxyColorSwatch
