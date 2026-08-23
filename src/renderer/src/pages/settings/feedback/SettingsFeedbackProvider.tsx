import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { AlertTitle, Snackbar, Stack, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import type { ToastPosition } from '@shared/types/settings'
import { TITLE_BAR_HEIGHT } from '@shared/theme/title-bar'
import ToastAlert from '../../../components/ui/ToastAlert'
import { useSettingsStore } from '../../../store/settingsStore'
import { isWindows } from '../../../lib/platform'
import {
  SettingsFeedbackContext,
  type SettingsFeedbackContextValue
} from './settingsFeedbackContext'

const toastAnchors: Record<ToastPosition, { vertical: 'top' | 'bottom'; horizontal: 'left' | 'center' | 'right' }> = {
  'top-left': { vertical: 'top', horizontal: 'left' },
  'top-center': { vertical: 'top', horizontal: 'center' },
  'top-right': { vertical: 'top', horizontal: 'right' },
  'bottom-left': { vertical: 'bottom', horizontal: 'left' },
  'bottom-center': { vertical: 'bottom', horizontal: 'center' },
  'bottom-right': { vertical: 'bottom', horizontal: 'right' }
}
/**
 * Shared snackbar feedback for all settings subpages. Rendered once in
 * SettingsShell; pages consume it via useSettingsFeedback().
 */
export function SettingsFeedbackProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const { t } = useTranslation()
  const toastPosition = useSettingsStore((state) => state.settings.toastPosition)
  const topOffset = isWindows() ? TITLE_BAR_HEIGHT + 8 : 72

  const [savedOpen, setSavedOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackTitle, setFeedbackTitle] = useState('')
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [feedbackSeverity, setFeedbackSeverity] = useState<'success' | 'error'>('success')

  const notifySaved = useCallback((): void => {
    setSavedOpen(true)
  }, [])

  const notifyFeedback = useCallback(
    (message: string, severity: 'success' | 'error' = 'success'): void => {
      const titleKey = severity === 'error' ? 'settings.feedbackErrorTitle' : 'settings.feedbackSuccessTitle'
      // t('settings.feedbackSuccessTitle') fallback will be handled by i18next; avoid hook call inside callback by storing message only.
      // Title resolved during render via t()
      setFeedbackTitle(titleKey)
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
          anchorOrigin={toastAnchors[toastPosition]}
          sx={{
            [`&.MuiSnackbar-anchorOriginTopLeft, &.MuiSnackbar-anchorOriginTopCenter,
              &.MuiSnackbar-anchorOriginTopRight`]: {
              top: topOffset
            }
          }}
        >
          <ToastAlert
            severity="success"
            onClose={() => setSavedOpen(false)}
            sx={{
              minWidth: { xs: 280, sm: 360 },
              maxWidth: 480,
              alignItems: 'flex-start',
              '& .MuiAlert-message': { width: '100%' }
            }}
          >
            <AlertTitle sx={{ mb: 0.5, fontWeight: 700, lineHeight: 1.35 }}>{t('settings.saved')}</AlertTitle>
            <Typography variant="body2" sx={{ opacity: 0.92, lineHeight: 1.45, whiteSpace: 'pre-line' }}>
              {t('settings.savedDescription')}
            </Typography>
          </ToastAlert>
        </Snackbar>

        <Snackbar
          open={feedbackOpen}
          autoHideDuration={4000}
          onClose={() => setFeedbackOpen(false)}
          anchorOrigin={toastAnchors[toastPosition]}
          sx={{
            [`&.MuiSnackbar-anchorOriginTopLeft, &.MuiSnackbar-anchorOriginTopCenter,
              &.MuiSnackbar-anchorOriginTopRight`]: {
              top: topOffset
            }
          }}
        >
          <ToastAlert
            severity={feedbackSeverity}
            onClose={() => setFeedbackOpen(false)}
            sx={{
              minWidth: { xs: 280, sm: 360 },
              maxWidth: 480,
              alignItems: 'flex-start',
              '& .MuiAlert-message': { width: '100%' }
            }}
          >
            <AlertTitle sx={{ mb: 0.5, fontWeight: 700, lineHeight: 1.35 }}>{t(feedbackTitle)}</AlertTitle>
            <Typography variant="body2" sx={{ opacity: 0.92, lineHeight: 1.45, whiteSpace: 'pre-line' }}>
              {feedbackMessage}
            </Typography>
          </ToastAlert>
        </Snackbar>
      </Stack>
    </SettingsFeedbackContext.Provider>
  )
}
