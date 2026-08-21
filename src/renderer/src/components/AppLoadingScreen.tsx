import { Box, CircularProgress } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { getPalette } from '../theme'
import { isWindows } from '../utils/platform'
import AppTitleBar from './AppTitleBar'

function AppLoadingScreen(): React.JSX.Element {
  const theme = useTheme()
  const palette = getPalette(theme)

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: palette.background.default
      }}
    >
      {isWindows() && <AppTitleBar />}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <CircularProgress size={36} thickness={4} />
      </Box>
    </Box>
  )
}

export default AppLoadingScreen
