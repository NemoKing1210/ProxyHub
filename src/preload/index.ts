import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { AppAPI } from '../shared/types/api'
import type { ProxyCheckProgress } from '../shared/types/proxy'

const api: AppAPI = {
  getProxies: () => ipcRenderer.invoke('proxy:get-all'),
  saveProxies: (proxies) => ipcRenderer.invoke('proxy:save-all', proxies),
  getGroups: () => ipcRenderer.invoke('groups:get-all'),
  saveGroups: (groups) => ipcRenderer.invoke('groups:save-all', groups),
  checkProxy: (proxy, options) => ipcRenderer.invoke('proxy:check', proxy, options),
  checkAll: (proxies, options) => ipcRenderer.invoke('proxy:check-all', proxies, options),
  cancelCheckAll: () => ipcRenderer.invoke('proxy:cancel-check-all'),
  onCheckProgress: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, progress: ProxyCheckProgress): void => {
      callback(progress)
    }

    ipcRenderer.on('proxy:check-progress', handler)
    return () => {
      ipcRenderer.removeListener('proxy:check-progress', handler)
    }
  },
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  getAppInfo: () => ipcRenderer.invoke('app:get-info'),
  openExternal: (url) => ipcRenderer.invoke('app:open-external', url),
  setTitleBarTheme: (mode) => ipcRenderer.invoke('app:set-title-bar-theme', mode),
  showMainWindow: () => ipcRenderer.invoke('tray:show-main'),
  isMainWindowBackgrounded: () => ipcRenderer.invoke('app:is-backgrounded'),
  showNotification: (payload) => ipcRenderer.invoke('app:show-notification', payload),
  onTrayProxiesUpdated: (callback) => {
    const handler = (): void => {
      callback()
    }

    ipcRenderer.on('tray:proxies-updated', handler)
    return () => {
      ipcRenderer.removeListener('tray:proxies-updated', handler)
    }
  },
  onOpenProxyFromTray: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, proxyId: string): void => {
      callback(proxyId)
    }

    ipcRenderer.on('tray:open-proxy', handler)
    return () => {
      ipcRenderer.removeListener('tray:open-proxy', handler)
    }
  },
  onCheckAllState: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, active: boolean): void => {
      callback(active)
    }

    ipcRenderer.on('proxy:check-all-state', handler)
    return () => {
      ipcRenderer.removeListener('proxy:check-all-state', handler)
    }
  },
  exportBackup: (request) => ipcRenderer.invoke('backup:export', request),
  previewBackup: () => ipcRenderer.invoke('backup:preview'),
  unlockBackupPreview: (request) => ipcRenderer.invoke('backup:unlock-preview', request),
  importBackup: (request) => ipcRenderer.invoke('backup:import', request),
  previewCsvImport: () => ipcRenderer.invoke('csv:preview'),
  importCsv: (request) => ipcRenderer.invoke('csv:import', request),
  exportCsv: (request) => ipcRenderer.invoke('csv:export', request),
  previewJsonImport: () => ipcRenderer.invoke('json:preview'),
  importJson: (request) => ipcRenderer.invoke('json:import', request),
  exportJson: (request) => ipcRenderer.invoke('json:export', request),
  previewTxtImport: () => ipcRenderer.invoke('txt:preview'),
  importTxt: (request) => ipcRenderer.invoke('txt:import', request),
  exportTxt: (request) => ipcRenderer.invoke('txt:export', request),
  getSyncConfig: () => ipcRenderer.invoke('sync:get-config'),
  saveSyncConfig: (request) => ipcRenderer.invoke('sync:save-config', request),
  testSyncConnection: (githubToken) => ipcRenderer.invoke('sync:test-connection', githubToken),
  pushSync: () => ipcRenderer.invoke('sync:push'),
  pullSyncPreview: (password) => ipcRenderer.invoke('sync:pull-preview', password),
  unlockSyncPullPreview: (sessionId, password) =>
    ipcRenderer.invoke('sync:unlock-pull-preview', sessionId, password),
  applySyncPull: (request) => ipcRenderer.invoke('sync:pull-apply', request),
  startupSyncPull: () => ipcRenderer.invoke('sync:startup-pull')
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-expect-error exposed in non-isolated mode
  window.electron = electronAPI
  // @ts-expect-error exposed in non-isolated mode
  window.api = api
}
