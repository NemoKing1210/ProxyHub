import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { AppAPI } from '../shared/types/api'
import type { ProxyCheckProgress } from '../shared/types/proxy'

const api: AppAPI = {
  getProxies: () => ipcRenderer.invoke('proxy:get-all'),
  saveProxies: (proxies) => ipcRenderer.invoke('proxy:save-all', proxies),
  checkProxy: (proxy) => ipcRenderer.invoke('proxy:check', proxy),
  checkAll: (proxies) => ipcRenderer.invoke('proxy:check-all', proxies),
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
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings)
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
