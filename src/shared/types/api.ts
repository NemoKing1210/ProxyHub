import type {
  BackupExportRequest,
  BackupExportResponse,
  BackupImportRequest,
  BackupImportResponse,
  BackupPreviewResponse,
  BackupUnlockPreviewRequest
} from './backup'
import type {
  CsvExportRequest,
  CsvExportResponse,
  CsvImportPreviewResponse,
  CsvImportRequest,
  CsvImportResponse,
  ProxyListExportRequest,
  ProxyListExportResponse,
  ProxyListImportPreviewResponse,
  ProxyListImportRequest,
  ProxyListImportResponse
} from './proxy-import'
import type { ThemeMode } from '../types/settings'
import type { AppInfo } from './app'
import type { ProxyGroup } from './proxy-group'
import type { Proxy, ProxyCheckProgress, ProxyCheckResult } from './proxy'
import type { AppSettings, ProxyCheckOptions } from './settings'
import type {
  SyncGoogleConnectResult,
  SyncGoogleDisconnectResult,
  SyncPublicState,
  SyncPullApplyRequest,
  SyncPullApplyResult,
  SyncPullPreviewResult,
  SyncPushResult,
  SyncSaveConfigRequest,
  SyncStartupPullResult,
  SyncTestResult
} from './sync'
import type { AppUpdateState } from './updater'

export interface AppNotificationPayload {
  title: string
  body?: string
}

export interface AppAPI {
  getProxies: () => Promise<Proxy[]>
  saveProxies: (proxies: Proxy[]) => Promise<void>
  getGroups: () => Promise<ProxyGroup[]>
  saveGroups: (groups: ProxyGroup[]) => Promise<void>
  checkProxy: (proxy: Proxy, options: ProxyCheckOptions) => Promise<ProxyCheckResult>
  checkAll: (proxies: Proxy[], options: ProxyCheckOptions) => Promise<void>
  cancelCheckAll: () => Promise<void>
  onCheckProgress: (callback: (progress: ProxyCheckProgress) => void) => () => void
  getSettings: () => Promise<AppSettings>
  saveSettings: (settings: AppSettings) => Promise<void>
  getAppInfo: () => Promise<AppInfo>
  openExternal: (url: string) => Promise<void>
  setTitleBarTheme: (mode: ThemeMode) => Promise<void>
  showMainWindow: () => Promise<void>
  isMainWindowBackgrounded: () => Promise<boolean>
  showNotification: (payload: AppNotificationPayload) => Promise<boolean>
  onTrayProxiesUpdated: (callback: () => void) => () => void
  onOpenProxyFromTray: (callback: (proxyId: string) => void) => () => void
  onCheckAllState: (callback: (active: boolean) => void) => () => void
  exportBackup: (request: BackupExportRequest) => Promise<BackupExportResponse>
  previewBackup: () => Promise<BackupPreviewResponse>
  unlockBackupPreview: (request: BackupUnlockPreviewRequest) => Promise<BackupPreviewResponse>
  importBackup: (request: BackupImportRequest) => Promise<BackupImportResponse>
  previewCsvImport: () => Promise<CsvImportPreviewResponse>
  importCsv: (request: CsvImportRequest) => Promise<CsvImportResponse>
  exportCsv: (request: CsvExportRequest) => Promise<CsvExportResponse>
  previewJsonImport: () => Promise<ProxyListImportPreviewResponse>
  importJson: (request: ProxyListImportRequest) => Promise<ProxyListImportResponse>
  exportJson: (request: ProxyListExportRequest) => Promise<ProxyListExportResponse>
  previewTxtImport: () => Promise<ProxyListImportPreviewResponse>
  importTxt: (request: ProxyListImportRequest) => Promise<ProxyListImportResponse>
  exportTxt: (request: ProxyListExportRequest) => Promise<ProxyListExportResponse>
  getSyncConfig: () => Promise<SyncPublicState>
  saveSyncConfig: (request: SyncSaveConfigRequest) => Promise<SyncPublicState>
  testSyncConnection: (githubToken?: string) => Promise<SyncTestResult>
  connectGoogleDrive: () => Promise<SyncGoogleConnectResult>
  disconnectGoogleDrive: () => Promise<SyncGoogleDisconnectResult>
  pushSync: () => Promise<SyncPushResult>
  pullSyncPreview: (password?: string) => Promise<SyncPullPreviewResult>
  unlockSyncPullPreview: (sessionId: string, password: string) => Promise<SyncPullPreviewResult>
  applySyncPull: (request: SyncPullApplyRequest) => Promise<SyncPullApplyResult>
  startupSyncPull: () => Promise<SyncStartupPullResult>
  getUpdateState: () => Promise<AppUpdateState>
  checkForUpdates: () => Promise<AppUpdateState>
  downloadUpdate: () => Promise<AppUpdateState>
  installUpdate: () => Promise<void>
  onUpdateStateChange: (callback: (state: AppUpdateState) => void) => () => void
}
