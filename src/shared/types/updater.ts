import type { AppUpdateErrorCode } from '../utils/update-error'

export type AppUpdateStatus =
  | 'disabled'
  | 'idle'
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'error'

export interface AppUpdateState {
  status: AppUpdateStatus
  currentVersion: string
  availableVersion?: string
  releaseNotes?: string
  downloadPercent?: number
  transferredBytes?: number
  totalBytes?: number
  bytesPerSecond?: number
  error?: string
  errorCode?: AppUpdateErrorCode
}
