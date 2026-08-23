import { Notification } from 'electron'
import icon from '../../../resources/icon.png?asset'
import type { AppNotificationPayload } from '@shared/types/api'
import { showMainWindow } from './main-window'
import { logger } from './logger'

const log = logger.scope('notifications')
export function showNativeNotification(payload: AppNotificationPayload): boolean {
  log.debug('showNativeNotification called', { title: payload.title })
  if (!Notification.isSupported()) {
    log.warn('Notifications not supported')
    return false
  }

  try {
    const notification = new Notification({
      title: payload.title,
      body: payload.body,
      icon
    })

    notification.on('click', () => {
      log.info('Notification clicked', { title: payload.title })
      showMainWindow()
    })

    notification.show()
    log.info('Notification shown', { title: payload.title })
    return true
  } catch (error) {
    log.error('Failed to show notification', error)
    throw error
  }
}
