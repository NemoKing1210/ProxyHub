import { useEffect } from 'react'
import { startSyncOnChangeScheduler } from '../../services/sync-on-change'

function SyncOnChangeSync(): null {
  useEffect(() => startSyncOnChangeScheduler(), [])

  return null
}

export default SyncOnChangeSync
