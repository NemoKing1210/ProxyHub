import { useEffect } from 'react'
import { useSettingsStore } from '../store/settingsStore'
import { isWindows } from '../utils/platform'

function NativeTitleBarSync(): null {
  const themeMode = useSettingsStore((state) => state.settings.theme)

  useEffect(() => {
    if (!isWindows()) {
      return
    }

    void window.api.setTitleBarTheme(themeMode)
  }, [themeMode])

  return null
}

export default NativeTitleBarSync
