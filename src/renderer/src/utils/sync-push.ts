import type { SyncPushResult } from '../../../shared/types/sync'
import { useSyncActivityStore } from '../store/syncActivityStore'

export async function pushSyncWithActivity(): Promise<SyncPushResult> {
  const { begin, end } = useSyncActivityStore.getState()

  begin()

  try {
    return await window.api.pushSync()
  } finally {
    end()
  }
}
