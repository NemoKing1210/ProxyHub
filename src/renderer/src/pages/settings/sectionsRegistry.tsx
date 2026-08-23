import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined'
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined'
import CloudSyncOutlinedIcon from '@mui/icons-material/CloudSyncOutlined'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import NetworkCheckOutlinedIcon from '@mui/icons-material/NetworkCheckOutlined'
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import WidgetsOutlinedIcon from '@mui/icons-material/WidgetsOutlined'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useSettingsStore } from '../../store/settingsStore'

export type SettingsSectionKey =
  'appearance' | 'system' | 'auto-check' | 'checking' | 'backup' | 'sync' | 'danger' | 'about'

export const SETTINGS_SECTION_KEYS: readonly string[] = [
  'appearance',
  'system',
  'auto-check',
  'checking',
  'backup',
  'sync',
  'danger',
  'about'
]

export function isSettingsSectionKey(value: string | undefined): value is SettingsSectionKey {
  return value !== undefined && SETTINGS_SECTION_KEYS.includes(value)
}

export interface SettingsSectionMeta {
  key: SettingsSectionKey
  path: string
  title: string
  description: string
  icon: ReactNode
  summary: string
}

/**
 * Settings category metadata. A hook rather than a constant: titles and
 * summaries depend on the active translation and current setting values.
 */
export function useSettingsSections(): SettingsSectionMeta[] {
  const { t } = useTranslation()
  const settings = useSettingsStore((state) => state.settings)

  const themeLabel =
    settings.theme === 'dark'
      ? t('settings.themeDark')
      : settings.theme === 'light'
        ? t('settings.themeLight')
        : t('settings.themeSystem')

  const enabledLabel = t('settings.backup.previewEnabled')
  const disabledLabel = t('settings.backup.previewDisabled')

  return [
    {
      key: 'appearance',
      path: '/settings/appearance',
      title: t('settings.sections.appearance'),
      description: t('settings.sections.appearanceDescription'),
      icon: <PaletteOutlinedIcon fontSize="small" />,
      summary: `${themeLabel} · ${settings.language.toUpperCase()}`
    },
    {
      key: 'system',
      path: '/settings/system',
      title: t('settings.sections.system'),
      description: t('settings.sections.systemDescription'),
      icon: <WidgetsOutlinedIcon fontSize="small" />,
      summary: settings.trayEnabled ? enabledLabel : disabledLabel
    },
    {
      key: 'auto-check',
      path: '/settings/auto-check',
      title: t('settings.sections.autoCheck'),
      description: t('settings.sections.autoCheckDescription'),
      icon: <AutorenewOutlinedIcon fontSize="small" />,
      summary: settings.autoCheckEnabled
        ? `${enabledLabel} · ${t('settings.autoCheckIntervalMinutes', {
            value: settings.autoCheckIntervalMinutes
          })}`
        : disabledLabel
    },
    {
      key: 'checking',
      path: '/settings/checking',
      title: t('settings.sections.checking'),
      description: t('settings.sections.checkingDescription'),
      icon: <NetworkCheckOutlinedIcon fontSize="small" />,
      summary: `${t('settings.checkTimeoutValue', {
        value: settings.checkTimeoutMs / 1000
      })} · ${
        settings.checkAllMode === 'parallel'
          ? t('settings.checkAllModeParallel')
          : t('settings.checkAllModeSequential')
      }`
    },
    {
      key: 'backup',
      path: '/settings/backup',
      title: t('settings.sections.backup'),
      description: t('settings.sections.backupDescription'),
      icon: <ArchiveOutlinedIcon fontSize="small" />,
      summary: t('settings.sections.backupDescription')
    },
    {
      key: 'sync',
      path: '/settings/sync',
      title: t('settings.sections.sync'),
      description: t('settings.sections.syncDescription'),
      icon: <CloudSyncOutlinedIcon fontSize="small" />,
      summary: t('settings.sections.syncDescription')
    },
    {
      key: 'danger',
      path: '/settings/danger',
      title: t('settings.sections.dangerZone'),
      description: t('settings.sections.dangerZoneDescription'),
      icon: <WarningAmberOutlinedIcon fontSize="small" />,
      summary: t('settings.sections.dangerZoneDescription')
    },
    {
      key: 'about',
      path: '/settings/about',
      title: t('settings.sections.about'),
      description: t('settings.sections.aboutDescription'),
      icon: <InfoOutlinedIcon fontSize="small" />,
      summary: t('settings.sections.aboutDescription')
    }
  ]
}
