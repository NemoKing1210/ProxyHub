import {
  AppBar,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Toolbar,
  Typography
} from '@mui/material'
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import SendIcon from '@mui/icons-material/Send'
import Versions from './components/Versions'

function App(): React.JSX.Element {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <NetworkCheckIcon sx={{ mr: 1.5 }} />
          <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }}>
            ProxyChecker
          </Typography>
        </Toolbar>
      </AppBar>

      <Container
        component="main"
        maxWidth="md"
        sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', py: 4 }}
      >
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            p: { xs: 3, sm: 5 },
            border: 1,
            borderColor: 'divider'
          }}
        >
          <Stack spacing={3} sx={{ alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="h4" gutterBottom>
                Electron + React + MUI
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Desktop-приложение для проверки прокси. Стек: Electron, React 19,
                TypeScript, Material UI.
              </Typography>
            </Box>

            <Typography variant="body2" color="text.secondary">
              Нажмите <code>F12</code>, чтобы открыть DevTools.
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button
                variant="contained"
                startIcon={<OpenInNewIcon />}
                href="https://electron-vite.org/"
                target="_blank"
                rel="noreferrer"
              >
                Документация
              </Button>
              <Button variant="outlined" startIcon={<SendIcon />} onClick={ipcHandle}>
                Отправить IPC
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Container>

      <Versions />
    </Box>
  )
}

export default App
