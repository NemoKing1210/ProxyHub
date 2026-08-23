import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { Alert, Snackbar, Stack } from '@mui/material'
import { useTranslation } from 'react-i18next'
import {
  SettingsFeedbackContext,
  type SettingsFeedbackContextValue
} from './settingsFeedbackContext'

/**
 * Общая обратная связь (snackbar-уведомления) для всех подстраниц настроек.
 * Рендерится один раз в SettingsPage, страницы потребляют через useSettingsFeedback().
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
          <Alert severity="success" variant="filled" onClose={() => setSavedOpen(false)}>
            {t('settings.saved')}
          </Alert>
        </Snackbar>

        <Snackbar
          open={feedbackOpen}
          autoHideDuration={4000}
          onClose={() => setFeedbackOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            severity={feedbackSeverity}
            variant="filled"
            onClose={() => setFeedbackOpen(false)}
          >
            {feedbackMessage}
          </Alert>
        </Snackbar>
      </Stack>
    </SettingsFeedbackContext.Provider>
  )
}
