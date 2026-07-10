import { Box, type BoxProps } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { getLatencyColor } from '../utils/latency'

interface LatencyTextProps extends Omit<BoxProps, 'children'> {
  latencyMs: number
}

function LatencyText({ latencyMs, sx, ...props }: LatencyTextProps): React.JSX.Element {
  const { t } = useTranslation()

  return (
    <Box
      component="span"
      sx={{
        color: getLatencyColor(latencyMs),
        fontWeight: 600,
        ...sx
      }}
      {...props}
    >
      {t('proxyList.latencyMs', { value: latencyMs })}
    </Box>
  )
}

export default LatencyText
