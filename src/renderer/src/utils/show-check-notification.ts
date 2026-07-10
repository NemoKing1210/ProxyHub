import type { AppNotificationPayload } from '../../../shared/types/api'
import { useSettingsStore } from '../store/settingsStore'
import { useToastStore, type Toast } from '../store/toastStore'

export async function showCheckNotification(toast: Omit<Toast, 'id'>): Promise<void> {
  const { backgroundCheckNotifications } = useSettingsStore.getState().settings

  if (backgroundCheckNotifications) {
    const isBackgrounded = await window.api.isMainWindowBackgrounded()

    if (isBackgrounded) {
      const payload: AppNotificationPayload = {
        title: toast.title,
        body: toast.message
      }

      const shown = await window.api.showNotification(payload)
      if (shown) {
        return
      }
    }
  }

  useToastStore.getState().show(toast)
}
