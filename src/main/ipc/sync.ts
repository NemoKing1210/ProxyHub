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
import { logger } from '../services/logger'
import { toSyncError } from '../services/sync/providers/sync-errors'
export function registerSyncIpc(): void {
  const log = logger.scope('ipc:sync')

  ipcMain.handle('sync:get-config', async (): Promise<SyncPublicState> => {
    log.info('sync:get-config invoked')
    try {
      const result = await getSyncPublicState()
      log.debug('sync:get-config succeeded')
      return result
    } catch (error) {
      log.error('sync:get-config failed', error)
      throw toSyncError(error)
    }
  })

  ipcMain.handle(
    'sync:save-config',
    async (_event, request: SyncSaveConfigRequest): Promise<SyncPublicState> => {
      log.info('sync:save-config invoked', {
        provider: request.config.provider,
        hasGithubToken: !!request.githubToken,
        hasPayloadPassword: !!request.payloadPassword,
        clearGithubToken: !!request.clearGithubToken,
        clearPayloadPassword: !!request.clearPayloadPassword
      })
      try {
        const result = await saveSyncConfiguration(request)
        log.debug('sync:save-config succeeded')
        return result
      } catch (error) {
        log.error('sync:save-config failed', error)
        throw toSyncError(error)
      }
    }
  )

  ipcMain.handle(
    'sync:test-connection',
    async (_event, githubToken?: string): Promise<SyncTestResult> => {
      log.info('sync:test-connection invoked', { hasGithubToken: !!githubToken })
      try {
        const result = await testSyncConnection(githubToken)
        log.debug('sync:test-connection succeeded', { ok: result.ok })
        return result
      } catch (error) {
        log.error('sync:test-connection failed', error)
        throw toSyncError(error)
      }
    }
  )

  ipcMain.handle('sync:google-connect', async (): Promise<SyncGoogleConnectResult> => {
    log.info('sync:google-connect invoked')
    try {
      const result = await connectGoogleDrive()
      log.debug('sync:google-connect succeeded')
      return result
    } catch (error) {
      log.error('sync:google-connect failed', error)
      throw toSyncError(error)
    }
  })

  ipcMain.handle('sync:google-disconnect', async (): Promise<SyncGoogleDisconnectResult> => {
    log.info('sync:google-disconnect invoked')
    try {
      const result = await disconnectGoogleDrive()
      log.debug('sync:google-disconnect succeeded')
      return result
    } catch (error) {
      log.error('sync:google-disconnect failed', error)
      throw toSyncError(error)
    }
  })

  ipcMain.handle('sync:push', async (): Promise<SyncPushResult> => {
    log.info('sync:push invoked')
    try {
      const result = await pushSync()
      log.debug('sync:push succeeded')
      return result
    } catch (error) {
      log.error('sync:push failed', error)
      throw toSyncError(error)
    }
  })

  ipcMain.handle(
    'sync:pull-preview',
    async (_event, password?: string): Promise<SyncPullPreviewResult> => {
      log.info('sync:pull-preview invoked', { hasPassword: !!password })
      try {
        const result = await pullSyncPreview(password)
        log.debug('sync:pull-preview succeeded')
        return result
      } catch (error) {
        log.error('sync:pull-preview failed', error)
        throw toSyncError(error)
      }
    }
  )

  ipcMain.handle(
    'sync:unlock-pull-preview',
    async (_event, sessionId: string, password: string): Promise<SyncPullPreviewResult> => {
      log.info('sync:unlock-pull-preview invoked', { sessionId, hasPassword: !!password })
      try {
        const result = await unlockSyncPullPreview(sessionId, password)
        log.debug('sync:unlock-pull-preview succeeded')
        return result
      } catch (error) {
        log.error('sync:unlock-pull-preview failed', error)
        throw toSyncError(error)
      }
    }
  )

  ipcMain.handle(
    'sync:pull-apply',
    async (_event, request: SyncPullApplyRequest): Promise<SyncPullApplyResult> => {
      log.info('sync:pull-apply invoked', { sessionId: request.sessionId })
      try {
        const result = await applySyncPull(request)
        log.debug('sync:pull-apply succeeded')
        return result
      } catch (error) {
        log.error('sync:pull-apply failed', error)
        throw toSyncError(error)
      }
    }
  )

  ipcMain.handle('sync:startup-pull', async (): Promise<SyncStartupPullResult> => {
    log.info('sync:startup-pull invoked')
    try {
      const result = await startupSyncPull()
      log.debug('sync:startup-pull succeeded')
      return result
    } catch (error) {
      log.error('sync:startup-pull failed', error)
      throw toSyncError(error)
    }
  })
}

export async function runStartupSyncPull(): Promise<void> {
  const log = logger.scope('ipc:sync')
  log.info('runStartupSyncPull invoked')
  try {
    await startupSyncPull()
    log.debug('runStartupSyncPull succeeded')
  } catch (error) {
    log.error('runStartupSyncPull failed', error)
    throw toSyncError(error)
  }
}
