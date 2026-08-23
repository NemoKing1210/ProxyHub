import { createContext } from 'react'

export interface SettingsFeedbackContextValue {
  /** Короткое подтверждение «Сохранено» для изменений настроек. */
  notifySaved: () => void
  /** Информационное сообщение (успех или ошибка) для операций backup/sync. */
  notifyFeedback: (message: string, severity?: 'success' | 'error') => void
}

export const SettingsFeedbackContext = createContext<SettingsFeedbackContextValue | null>(null)
