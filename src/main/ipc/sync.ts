import { ipcMain } from 'electron'
import type {
  SyncPullApplyRequest,
  SyncPullApplyResult,
  SyncPublicState,
  SyncPullPreviewResult,
  SyncPushResult,
  SyncSaveConfigRequest,
  SyncStartupPullResult,
  SyncTestResult
} from '../../shared/types/sync'
import {
  applySyncPull,
  getSyncPublicState,
  pullSyncPreview,
  pushSync,
  saveSyncConfiguration,
  startupSyncPull,
  testSyncConnection,
  unlockSyncPullPreview
} from '../services/sync/sync-service'
import { toSyncError } from '../services/sync/providers/github-gist'

export function registerSyncIpc(): void {
  ipcMain.handle('sync:get-config', async (): Promise<SyncPublicState> => {
    return getSyncPublicState()
  })

  ipcMain.handle(
    'sync:save-config',
    async (_event, request: SyncSaveConfigRequest): Promise<SyncPublicState> => {
      try {
        return await saveSyncConfiguration(request)
      } catch (error) {
        throw toSyncError(error)
      }
    }
  )

  ipcMain.handle(
    'sync:test-connection',
    async (_event, githubToken?: string): Promise<SyncTestResult> => {
      return testSyncConnection(githubToken)
    }
  )

  ipcMain.handle('sync:push', async (): Promise<SyncPushResult> => {
    return pushSync()
  })

  ipcMain.handle(
    'sync:pull-preview',
    async (_event, password?: string): Promise<SyncPullPreviewResult> => {
      return pullSyncPreview(password)
    }
  )

  ipcMain.handle(
    'sync:unlock-pull-preview',
    async (_event, sessionId: string, password: string): Promise<SyncPullPreviewResult> => {
      return unlockSyncPullPreview(sessionId, password)
    }
  )

  ipcMain.handle(
    'sync:pull-apply',
    async (_event, request: SyncPullApplyRequest): Promise<SyncPullApplyResult> => {
      return applySyncPull(request)
    }
  )

  ipcMain.handle('sync:startup-pull', async (): Promise<SyncStartupPullResult> => {
    return startupSyncPull()
  })
}

export async function runStartupSyncPull(): Promise<void> {
  await startupSyncPull()
}
