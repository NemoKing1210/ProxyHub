import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { Snackbar, Stack } from '@mui/material'
import { useTranslation } from 'react-i18next'
import ToastAlert from '../../../components/ui/ToastAlert'
import {
  SettingsFeedbackContext,
  type SettingsFeedbackContextValue
} from './settingsFeedbackContext'

/**
 * Shared snackbar feedback for all settings subpages. Rendered once in
 * SettingsShell; pages consume it via useSettingsFeedback().
 */
export function SettingsFeedbackProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const { t } = useTranslation()

  const [savedOpen, setSavedOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [feedbackSeverity, setFeedbackSeverity] = useState<'success' | 'error'>('success')

  const notifySaved = useCallback((): void => {
    setSavedOpen(true)
  }, [])

  const notifyFeedback = useCallback(
    (message: string, severity: 'success' | 'error' = 'success'): void => {
      setFeedbackMessage(message)
      setFeedbackSeverity(severity)
      setFeedbackOpen(true)
    },
    []
  )

  const value = useMemo<SettingsFeedbackContextValue>(
    () => ({ notifySaved, notifyFeedback }),
    [notifySaved, notifyFeedback]
  )

  return (
    <SettingsFeedbackContext.Provider value={value}>
      {children}

      <Stack>
        <Snackbar
          open={savedOpen}
          autoHideDuration={2000}
          onClose={() => setSavedOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <ToastAlert severity="success" onClose={() => setSavedOpen(false)}>
            {t('settings.saved')}
          </ToastAlert>
        </Snackbar>

        <Snackbar
          open={feedbackOpen}
          autoHideDuration={4000}
          onClose={() => setFeedbackOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <ToastAlert severity={feedbackSeverity} onClose={() => setFeedbackOpen(false)}>
            {feedbackMessage}
          </ToastAlert>
        </Snackbar>
      </Stack>
    </SettingsFeedbackContext.Provider>
  )
}
