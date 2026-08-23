import { createContext } from 'react'

export interface SettingsFeedbackContextValue {
  notifySaved: () => void
  notifyFeedback: (message: string, severity?: 'success' | 'error') => void
}

export const SettingsFeedbackContext = createContext<SettingsFeedbackContextValue | null>(null)
