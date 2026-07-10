import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#5c8aff'
    },
    secondary: {
      main: '#7c93ee'
    },
    background: {
      default: '#0f1117',
      paper: '#1a1d27'
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
  },
  shape: {
    borderRadius: 10
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          userSelect: 'none'
        }
      }
    }
  }
})
