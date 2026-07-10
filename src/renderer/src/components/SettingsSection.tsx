import { Box, Stack, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import type { ReactNode } from 'react'

interface SettingsSectionProps {
  icon: ReactNode
  title: string
  description?: string
  children: ReactNode
}

function SettingsSection({
  icon,
  title,
  description,
  children
}: SettingsSectionProps): React.JSX.Element {
  const theme = useTheme()

  return (
    <Box
      sx={{
        p: { xs: 2.5, sm: 3 },
        borderRadius: 2.5,
        bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.06 : 0.04)
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ mb: description ? 1 : 2, alignItems: 'flex-start' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: 2,
            flexShrink: 0,
            bgcolor: alpha(theme.palette.primary.main, 0.14),
            color: 'primary.main'
          }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0, pt: 0.25 }}>
          <Typography variant="h6" sx={{ fontSize: '1.05rem', fontWeight: 600, lineHeight: 1.3 }}>
            {title}
          </Typography>
          {description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {description}
            </Typography>
          )}
        </Box>
      </Stack>

      <Box sx={{ pl: { xs: 0, sm: 6.5 } }}>{children}</Box>
    </Box>
  )
}

export default SettingsSection
