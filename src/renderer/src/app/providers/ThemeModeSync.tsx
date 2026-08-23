import { useEffect } from 'react'
import { useColorScheme } from '@mui/material/styles'
import { useSettingsStore } from '../../store/settingsStore'

/** Синхронизирует тему из стора настроек со схемой MUI. */
function ThemeModeSync(): null {
  const themeMode = useSettingsStore((state) => state.settings.theme)
  const { setMode } = useColorScheme()

  useEffect(() => {
    setMode(themeMode)
  }, [themeMode, setMode])

  return null
}

export default ThemeModeSync
