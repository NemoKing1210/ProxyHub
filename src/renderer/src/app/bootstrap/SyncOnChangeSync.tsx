import { useEffect } from 'react'
import { startSyncOnChangeScheduler } from '../../utils/sync-on-change'

function SyncOnChangeSync(): null {
  useEffect(() => startSyncOnChangeScheduler(), [])

  return null
}

export default SyncOnChangeSync
