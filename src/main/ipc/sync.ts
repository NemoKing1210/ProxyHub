import { ipcMain } from 'electron'
import type {
  SyncGoogleConnectResult,
  SyncGoogleDisconnectResult,
  SyncPullApplyRequest,
  SyncPullApplyResult,
  SyncPublicState,
  SyncPullPreviewResult,
  SyncPushResult,
  SyncSaveConfigRequest,
  SyncStartupPullResult,
  SyncTestResult
} from '@shared/types/sync'
import {
  applySyncPull,
  connectGoogleDrive,
  disconnectGoogleDrive,
  getSyncPublicState,
  pullSyncPreview,
  pushSync,
  saveSyncConfiguration,
  startupSyncPull,
  testSyncConnection,
  unlockSyncPullPreview
} from '../services/sync/sync-service'
import { toSyncError } from '../services/sync/providers/sync-errors'

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

  ipcMain.handle('sync:google-connect', async (): Promise<SyncGoogleConnectResult> => {
    return connectGoogleDrive()
  })

  ipcMain.handle('sync:google-disconnect', async (): Promise<SyncGoogleDisconnectResult> => {
    return disconnectGoogleDrive()
  })

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
