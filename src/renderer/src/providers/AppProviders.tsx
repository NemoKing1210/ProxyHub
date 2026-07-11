import { useEffect, useMemo, useState } from 'react'
import { CssBaseline, ThemeProvider } from '@mui/material'
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'
import { useColorScheme } from '@mui/material/styles'
import { I18nextProvider } from 'react-i18next'
import { HashRouter } from 'react-router-dom'
import i18n from '../i18n'
import App from '../App'
import AppLoadingScreen from '../components/AppLoadingScreen'
import AutoCheckSync from '../components/AutoCheckSync'
import CheckNotificationSync from '../components/CheckNotificationSync'
import CheckToastHost from '../components/CheckToastHost'
import NativeTitleBarSync from '../components/NativeTitleBarSync'
import ProxyDataSync from '../components/ProxyDataSync'
import SyncBackgroundSync from '../components/SyncBackgroundSync'
import SyncOnChangeSync from '../components/SyncOnChangeSync'
import { useGroupStore } from '../store/groupStore'
import { useProxyStore } from '../store/proxyStore'
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
  const isReady = useSettingsStore((state) => state.isReady)
  const language = useSettingsStore((state) => state.settings.language)
  const themeSetting = useSettingsStore((state) => state.settings.theme)
  const loadSettings = useSettingsStore((state) => state.loadSettings)
  const loadProxies = useProxyStore((state) => state.loadProxies)
  const loadGroups = useGroupStore((state) => state.loadGroups)
  const [isDataReady, setIsDataReady] = useState(false)
  const direction = RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr'
  const theme = useMemo(() => createAppTheme(direction), [direction])
  const themeMode = isReady ? themeSetting : 'dark'
  const isAppReady = isReady && isDataReady

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

  useEffect(() => {
    if (!isReady) {
      setIsDataReady(false)
      return
    }

    let cancelled = false

    void Promise.all([loadProxies(), loadGroups()]).finally(() => {
      if (!cancelled) {
        setIsDataReady(true)
      }
    })

    return () => {
      cancelled = true
    }
  }, [isReady, loadProxies, loadGroups])

  if (!isAppReady) {
    return (
      <>
        <InitColorSchemeScript attribute="data" defaultMode={themeMode} />
        <I18nextProvider i18n={i18n}>
          <ThemeProvider theme={theme} defaultMode={themeMode} disableTransitionOnChange>
            <CssBaseline />
            <AppLoadingScreen />
          </ThemeProvider>
        </I18nextProvider>
      </>
    )
  }

  return (
    <>
      <InitColorSchemeScript attribute="data" defaultMode={themeSetting} />
      <I18nextProvider i18n={i18n}>
        <ThemeProvider theme={theme} defaultMode={themeSetting} disableTransitionOnChange>
          <CssBaseline />
          <ThemeModeSync />
          <NativeTitleBarSync />
          <ProxyDataSync />
          <CheckNotificationSync />
          <AutoCheckSync />
          <SyncBackgroundSync />
          <SyncOnChangeSync />
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
