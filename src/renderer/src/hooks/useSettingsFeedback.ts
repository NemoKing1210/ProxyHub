import { useContext } from 'react'
import {
  SettingsFeedbackContext,
  type SettingsFeedbackContextValue
} from '../pages/settings/feedback/settingsFeedbackContext'

export function useSettingsFeedback(): SettingsFeedbackContextValue {
  const context = useContext(SettingsFeedbackContext)

  if (!context) {
    throw new Error('useSettingsFeedback must be used within SettingsFeedbackProvider')
  }

  return context
}
