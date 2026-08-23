import { Box } from '@mui/material'
import type { ReactNode } from 'react'
import { SettingsFeedbackProvider } from './feedback/SettingsFeedbackProvider'

interface SettingsShellProps {
  children: ReactNode
}

/**
 * Settings screen shell: shared feedback (snackbars) for the category list
 * and all subpages. Used as a wrapper for each route rather than a layout
 * route with an Outlet, so the page is cached whole by the transition
 * animator and its content doesn't change mid-animation.
 */
function SettingsShell({ children }: SettingsShellProps): React.JSX.Element {
  return (
    <Box sx={{ width: '100%' }}>
      <SettingsFeedbackProvider>{children}</SettingsFeedbackProvider>
    </Box>
  )
}

export default SettingsShell
