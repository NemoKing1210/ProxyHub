import { useEffect, useMemo, useState } from 'react'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { I18nextProvider } from 'react-i18next'
import { HashRouter } from 'react-router-dom'
import i18n from '../i18n'
import App from '../App'
import { useSettingsStore } from '../store/settingsStore'
import { createAppTheme, resolveThemeMode } from '../theme'
import { RTL_LANGUAGES } from '../../../shared/types/settings'

function AppProviders(): React.JSX.Element {
  const { settings, isReady, loadSettings } = useSettingsStore()
  const [resolvedMode, setResolvedMode] = useState<'light' | 'dark'>(() =>
    resolveThemeMode(settings.theme)
  )

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

  useEffect(() => {
    setResolvedMode(resolveThemeMode(settings.theme))

    if (settings.theme !== 'system') return

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (): void => setResolvedMode(resolveThemeMode('system'))

    media.addEventListener('change', handler)
    return () => media.removeEventListener('change', handler)
  }, [settings.theme])

  const direction = RTL_LANGUAGES.includes(settings.language) ? 'rtl' : 'ltr'
  const theme = useMemo(() => createAppTheme(resolvedMode, direction), [resolvedMode, direction])

  if (!isReady) {
    return <></>
  }

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <HashRouter>
          <App />
        </HashRouter>
      </ThemeProvider>
    </I18nextProvider>
  )
}

export default AppProviders
