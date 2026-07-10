import { Chip } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useAutoCheckCountdown } from '../hooks/useAutoCheckCountdown'
import { surfaceContainer } from '../theme'

interface AutoCheckCountdownBadgeProps {
  enabled: boolean
  embedded?: boolean
}

function AutoCheckCountdownBadge({
  enabled,
  embedded = false
}: AutoCheckCountdownBadgeProps): React.JSX.Element | null {
  const theme = useTheme()
  const countdownLabel = useAutoCheckCountdown(enabled)

  if (!countdownLabel) {
    return null
  }

  return (
    <Chip
      label={countdownLabel}
      size="small"
      sx={{
        fontWeight: 700,
        fontFamily: 'monospace',
        height: embedded ? 20 : 24,
        fontSize: embedded ? '0.72rem' : undefined,
        bgcolor: embedded ? 'action.hover' : surfaceContainer(theme, 'high'),
        color: 'primary.main',
        pointerEvents: 'none',
        '& .MuiChip-label': { px: embedded ? 0.75 : 1.25 }
      }}
    />
  )
}

export default AutoCheckCountdownBadge
