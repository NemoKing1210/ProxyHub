import { useEffect, useMemo } from 'react'
import { CssBaseline, ThemeProvider } from '@mui/material'
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'
import { useColorScheme } from '@mui/material/styles'
import { I18nextProvider } from 'react-i18next'
import { HashRouter } from 'react-router-dom'
import i18n from '../i18n'
import App from '../App'
import AutoCheckSync from '../components/AutoCheckSync'
import CheckNotificationSync from '../components/CheckNotificationSync'
import CheckToastHost from '../components/CheckToastHost'
import NativeTitleBarSync from '../components/NativeTitleBarSync'
import ProxyDataSync from '../components/ProxyDataSync'
import { useSettingsStore } from '../store/settingsStore'
import { createAppTheme } from '../theme'
import { RTL_LANGUAGES } from '../../../shared/types/settings'

function ThemeModeSync(): null {
  const themeMode = useSettingsStore((state) => state.settings.theme)
  const { setMode } = useColorScheme()

  useEffect(() => {
    setMode(themeMode)
  }, [themeMode, setMode])

  return null
}

function AppProviders(): React.JSX.Element {
  const { settings, isReady, loadSettings } = useSettingsStore()
  const direction = RTL_LANGUAGES.includes(settings.language) ? 'rtl' : 'ltr'
  const theme = useMemo(() => createAppTheme(direction), [direction])

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

  if (!isReady) {
    return (
      <>
        <InitColorSchemeScript attribute="data" defaultMode="dark" />
      </>
    )
  }

  return (
    <>
      <InitColorSchemeScript attribute="data" defaultMode={settings.theme} />
      <I18nextProvider i18n={i18n}>
        <ThemeProvider theme={theme} defaultMode={settings.theme} disableTransitionOnChange>
          <CssBaseline />
          <ThemeModeSync />
          <NativeTitleBarSync />
          <ProxyDataSync />
          <CheckNotificationSync />
          <AutoCheckSync />
          <CheckToastHost />
          <HashRouter>
            <App />
          </HashRouter>
        </ThemeProvider>
      </I18nextProvider>
    </>
  )
}

export default AppProviders
