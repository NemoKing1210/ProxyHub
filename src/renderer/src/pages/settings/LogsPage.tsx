import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { LogsInfo, LogLevel } from '@shared/types/logger'
import SettingsSectionHeader from './components/SettingsSectionHeader'
import LogsSection from './sections/LogsSection'
import { useSettingsStore } from '../../store/settingsStore'
import { useSettingsFeedback } from '../../hooks/useSettingsFeedback'
import { logger } from '../../lib/renderer-logger'

const logsUiLogger = logger.scope('logs-ui')
function LogsPage(): React.JSX.Element {
  const { t } = useTranslation()
  const settings = useSettingsStore((state) => state.settings)
  const updateSettings = useSettingsStore((state) => state.updateSettings)
  const { notifySaved, notifyFeedback } = useSettingsFeedback()
  const [logsInfo, setLogsInfo] = useState<LogsInfo | null>(null)

  const refreshLogsInfo = async (): Promise<void> => {
    logsUiLogger.debug('Refreshing logs info')
    try {
      const info = await window.api.getLogsInfo()
      setLogsInfo(info)
      logsUiLogger.debug('Logs info refreshed', { files: info.files.length })
    } catch (error) {
      logsUiLogger.error('Failed to refresh logs info', error)
    }
  }

  useEffect(() => {
    void refreshLogsInfo()
    const interval = window.setInterval(() => {
      void refreshLogsInfo()
    }, 5000)
    return () => window.clearInterval(interval)
  }, [])

  const handleLogLevelChange = async (level: LogLevel): Promise<void> => {
    logsUiLogger.info('Changing log level', { level })
    try {
      await updateSettings({ logLevel: level })
      logsUiLogger.info('Log level changed', { level })
      notifySaved()
      void refreshLogsInfo()
    } catch (error) {
      logsUiLogger.error('Failed to change log level', { level, error })
      notifyFeedback(
        `${t('settings.logs.updateError')}: ${error instanceof Error ? error.message : String(error)}`,
        'error'
      )
    }
  }

  const handleOpenFolder = async (): Promise<void> => {
    logsUiLogger.info('Opening logs folder')
    try {
      const dir = await window.api.openLogsFolder()
      logsUiLogger.info('Logs folder opened', { dir })
    } catch (error) {
      logsUiLogger.error('Failed to open logs folder', error)
      notifyFeedback(
        `${t('settings.logs.openError')}: ${error instanceof Error ? error.message : String(error)}`,
        'error'
      )
    }
  }

  const handleOpenFile = async (fileName: string): Promise<void> => {
    logsUiLogger.info('Opening log file', { fileName })
    try {
      if (typeof window.api.openLogFile !== 'function') {
        throw new Error('window.api.openLogFile is not a function — preload outdated, rebuild required')
      }
      const path = await window.api.openLogFile(fileName)
      logsUiLogger.info('Log file opened', { fileName, path })
    } catch (error) {
      logsUiLogger.error('Failed to open log file', { fileName, error })
      notifyFeedback(
        `${t('settings.logs.openFileError')}: ${error instanceof Error ? error.message : String(error)}`,
        'error'
      )
    }
  }

  const handleClearLogs = async (): Promise<void> => {
    logsUiLogger.info('Clearing logs')
    try {
      await window.api.clearLogs()
      logsUiLogger.info('Logs cleared')
      notifyFeedback(t('settings.logs.clearLogsSuccess'), 'success')
      void refreshLogsInfo()
    } catch (error) {
      logsUiLogger.error('Failed to clear logs', error)
      notifyFeedback(
        `${t('settings.logs.clearError')}: ${error instanceof Error ? error.message : String(error)}`,
        'error'
      )
    }
  }

  return (
    <>
      <SettingsSectionHeader />
      <LogsSection
        logLevel={settings.logLevel}
        onLogLevelChange={(level) => void handleLogLevelChange(level)}
        logsInfo={logsInfo}
        onOpenFolder={() => void handleOpenFolder()}
        onOpenFile={(fileName) => void handleOpenFile(fileName)}
        onClearLogs={() => void handleClearLogs()}
      />
    </>
  )
}

export default LogsPage
