import { Box, Switch, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { ReactNode } from 'react'
import { MD3_DURATION, MD3_EASING, surfaceContainer, surfaceTint } from '../../theme'

interface SettingsSwitchCardProps {
  icon: ReactNode
  title: string
  hint: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  compact?: boolean
  accent?: 'primary' | 'info'
  clickable?: boolean
}

function SettingsSwitchCard({
  icon,
  title,
  hint,
  checked,
  onChange,
  disabled = false,
  compact = false,
  accent = 'primary',
  clickable = false
}: SettingsSwitchCardProps): React.JSX.Element {
  const theme = useTheme()

  const handleCardKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (!clickable || disabled || (event.key !== 'Enter' && event.key !== ' ')) {
      return
    }

    event.preventDefault()
    onChange(!checked)
  }

  return (
    <Box
      role={clickable ? 'button' : undefined}
      tabIndex={clickable && !disabled ? 0 : undefined}
      aria-pressed={clickable ? checked : undefined}
      onClick={clickable && !disabled ? () => onChange(!checked) : undefined}
      onKeyDown={handleCardKeyDown}
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: compact ? 1.25 : 1.5,
        px: compact ? 1.5 : 1.75,
        py: compact ? 1.35 : 1.6,
        borderRadius: '16px',
        bgcolor: clickable ? surfaceContainer(theme, 'low') : undefined,
        cursor: clickable && !disabled ? 'pointer' : undefined,
        transition: `background-color ${MD3_DURATION.short4}ms ${MD3_EASING.standard}, transform ${MD3_DURATION.short3}ms ${MD3_EASING.standard}`,
        ...(clickable && !disabled
          ? {
              '&:hover': {
                bgcolor: surfaceContainer(theme, 'default'),
                transform: 'translateY(-1px)'
              },
              '&:active': {
                transform: 'translateY(0)'
              },
              '&:focus-visible': {
                outline: `3px solid ${surfaceTint(theme, accent, 0.42)}`,
                outlineOffset: 2
              }
            }
          : {})
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: compact ? 36 : 40,
          height: compact ? 36 : 40,
          borderRadius: '12px',
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
        onClick={clickable ? (event) => event.stopPropagation() : undefined}
        onKeyDown={clickable ? (event) => event.stopPropagation() : undefined}
        disabled={disabled}
        sx={{ mt: 0.15, flexShrink: 0 }}
      />
    </Box>
  )
}

export default SettingsSwitchCard
