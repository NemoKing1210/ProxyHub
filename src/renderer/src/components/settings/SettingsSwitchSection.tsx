import { Box, Switch, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { ReactNode } from 'react'
import {
  elevationShadow,
  MD3_DURATION,
  MD3_EASING,
  surfaceContainer,
  surfaceTint
} from '../../theme'

interface SettingsSwitchSectionProps {
  icon: ReactNode
  title: ReactNode
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  accent?: 'primary' | 'info' | 'error' | 'warning'
  children?: ReactNode
  listRadius?: string
}

/**
 * Settings card whose header row is the switch control itself: icon tile,
 * title, description and a trailing switch. Replaces the previous pattern of
 * a ContentSection wrapping a lone SettingsSwitchCard with the same title and
 * hint, which duplicated both. Extra content (revealed panels, dependent
 * switches) can be passed as children — it renders below the toggle row
 * inside the same card.
 */
function SettingsSwitchSection({
  icon,
  title,
  description,
  checked,
  onChange,
  disabled = false,
  accent = 'primary',
  children,
  listRadius
}: SettingsSwitchSectionProps): React.JSX.Element {
  const theme = useTheme()

  const toggle = (): void => {
    if (!disabled) {
      onChange(!checked)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (disabled || (event.key !== 'Enter' && event.key !== ' ')) {
      return
    }

    event.preventDefault()
    toggle()
  }

  return (
    <Box
      sx={{
        p: { xs: 2.5, sm: 3 },
        borderRadius: listRadius ?? '16px',
        bgcolor: surfaceContainer(theme, 'low'),
        boxShadow: elevationShadow(theme, 1),
        transition: `box-shadow ${MD3_DURATION.short4}ms ${MD3_EASING.standard}`,
        '&:hover': {
          boxShadow: elevationShadow(theme, 2)
        }
      }}
    >
      <Box
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? undefined : 0}
        onClick={disabled ? undefined : toggle}
        onKeyDown={handleKeyDown}
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1.5,
          mb: children ? (description ? 1 : 2) : 0,
          cursor: disabled ? 'default' : 'pointer',
          ...(disabled
            ? {}
            : {
                '&:focus-visible': {
                  outline: `3px solid ${surfaceTint(theme, accent, 0.42)}`,
                  outlineOffset: 2
                }
              })
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 44,
            height: 44,
            borderRadius: '16px',
            flexShrink: 0,
            bgcolor: surfaceTint(theme, accent, 0.18),
            color: `${accent}.main`,
            transition: `transform ${MD3_DURATION.short4}ms ${MD3_EASING.standard}`
          }}
        >
          {icon}
        </Box>

        <Box sx={{ minWidth: 0, pt: 0.25, flex: 1 }}>
          <Typography
            variant="h6"
            sx={{
              fontSize: '1.05rem',
              fontWeight: 600,
              lineHeight: 1.3,
              color: accent === 'primary' ? 'text.primary' : `${accent}.main`
            }}
          >
            {title}
          </Typography>
          {description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {description}
            </Typography>
          )}
        </Box>

        <Switch
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          disabled={disabled}
          sx={{ mt: 0.25, flexShrink: 0 }}
        />
      </Box>

      {children}
    </Box>
  )
}

export default SettingsSwitchSection
