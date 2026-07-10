import { Box, Switch, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { ReactNode } from 'react'
import { MD3_DURATION, MD3_EASING, surfaceTint } from '../theme'

interface SettingsSwitchCardProps {
  icon: ReactNode
  title: string
  hint: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  compact?: boolean
  accent?: 'primary' | 'info'
}

function SettingsSwitchCard({
  icon,
  title,
  hint,
  checked,
  onChange,
  disabled = false,
  compact = false,
  accent = 'primary'
}: SettingsSwitchCardProps): React.JSX.Element {
  const theme = useTheme()

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: compact ? 1.25 : 1.5,
        px: compact ? 1.5 : 1.75,
        py: compact ? 1.35 : 1.6,
        transition: `background-color ${MD3_DURATION.short4}ms ${MD3_EASING.standard}`
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: compact ? 36 : 40,
          height: compact ? 36 : 40,
          borderRadius: 2,
          flexShrink: 0,
          bgcolor: surfaceTint(theme, accent, compact ? 0.12 : 0.16),
          color: `${accent}.main`,
          transition: `transform ${MD3_DURATION.short3}ms ${MD3_EASING.standard}`
        }}
      >
        {icon}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0, pt: 0.15, pr: 1 }}>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            lineHeight: 1.35,
            fontSize: compact ? '0.875rem' : undefined
          }}
        >
          {title}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mt: 0.35,
            lineHeight: 1.45,
            fontSize: compact ? '0.78rem' : '0.8125rem'
          }}
        >
          {hint}
        </Typography>
      </Box>

      <Switch
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
        sx={{ mt: 0.15, flexShrink: 0 }}
      />
    </Box>
  )
}

export default SettingsSwitchCard
