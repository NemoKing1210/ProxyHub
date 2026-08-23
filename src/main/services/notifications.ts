import { Notification } from 'electron'
import icon from '../../../resources/icon.png?asset'
import type { AppNotificationPayload } from '@shared/types/api'
import { showMainWindow } from './main-window'

export function showNativeNotification(payload: AppNotificationPayload): boolean {
  if (!Notification.isSupported()) {
    return false
  }

  const notification = new Notification({
    title: payload.title,
    body: payload.body,
    icon
  })

  notification.on('click', () => {
    showMainWindow()
  })

  notification.show()
  return true
}
