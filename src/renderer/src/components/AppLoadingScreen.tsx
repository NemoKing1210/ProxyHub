import { Box, CircularProgress } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { TITLE_BAR_HEIGHT } from '../../../shared/theme/title-bar'
import { getPalette } from '../theme'
import { isWindows } from '../utils/platform'

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
      {isWindows() && (
        <Box
          sx={{
            height: TITLE_BAR_HEIGHT,
            flexShrink: 0,
            WebkitAppRegion: 'drag'
          }}
        />
      )}
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
