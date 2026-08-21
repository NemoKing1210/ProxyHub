import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import DataObjectOutlinedIcon from '@mui/icons-material/DataObjectOutlined'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined'
import SwapHorizOutlinedIcon from '@mui/icons-material/SwapHorizOutlined'
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import { useTheme } from '@mui/material/styles'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type {
  BackupExportKind,
  BackupImportMode,
  BackupPreview
} from '../../../shared/types/backup'
import type {
  ProxyListImportFormat,
  ProxyListImportPreview
} from '../../../shared/types/proxy-import'
import type { Proxy } from '../../../shared/types/proxy'
import type { ProxyGroup } from '../../../shared/types/proxy-group'
import BackupExportProxiesDialog from './BackupExportProxiesDialog'
import BackupImportPreviewDialog from './BackupImportPreviewDialog'
import BackupPasswordFields, { validateBackupExportPassword } from './BackupPasswordFields'
import ContentSection from './ContentSection'
import CsvImportPreviewDialog from './CsvImportPreviewDialog'
import { outlineVariant, surfaceContainer, withThemeAlpha } from '../theme'
import { BACKUP_MIN_PASSWORD_LENGTH } from '../../../shared/constants/backup-crypto'

interface SettingsBackupSectionProps {
  proxies: Proxy[]
  groups: ProxyGroup[]
  onExportSuccess: () => void
  onListExportSuccess: (format: ProxyListImportFormat) => void
  onImportSuccess: (summary: {
    proxiesAdded: number
    groupsAdded: number
    settingsImported: boolean
  }) => void
  onListImportSuccess: (summary: {
    format: ProxyListImportFormat
    proxiesAdded: number
    skippedDuplicates: number
  }) => void
  onError: (message: string) => void
  onReloadData: () => Promise<void>
}

interface ListFormatConfig {
  format: ProxyListImportFormat
  icon: ReactNode
  accent: string
  extension: string
}

const FORMAT_LABEL_KEYS: Record<ProxyListImportFormat, string> = {
  csv: 'settings.backup.formatCsv',
  json: 'settings.backup.formatJson',
  txt: 'settings.backup.formatTxt'
}

const LIST_FORMATS: ListFormatConfig[] = [
  {
    format: 'csv',
    icon: <TableChartOutlinedIcon fontSize="small" />,
    accent: '#2e7d32',
    extension: '.csv'
  },
  {
    format: 'json',
    icon: <DataObjectOutlinedIcon fontSize="small" />,
    accent: '#ed6c02',
    extension: '.json'
  },
  {
    format: 'txt',
    icon: <ArticleOutlinedIcon fontSize="small" />,
    accent: '#0288d1',
    extension: '.txt'
  }
]

function includesProxiesInExport(kind: BackupExportKind): boolean {
  return kind === 'full' || kind === 'proxies'
}

function resolveBackupError(
  t: (key: string, options?: Record<string, unknown>) => string,
  error: { code: string; message: string }
): string {
  const messageKey = `settings.backup.errors.${error.code}`
  const localized = t(messageKey, { defaultValue: '' })

  return (
    localized ||
    t('settings.backup.importError', {
      message: error.message
    })
  )
}

function resolveListImportError(
  t: (key: string, options?: Record<string, unknown>) => string,
  format: ProxyListImportFormat,
  error: { code: string; message: string }
): string {
  const messageKey = `settings.backup.${format}.errors.${error.code}`
  const localized = t(messageKey, { defaultValue: '' })

  return (
    localized ||
    t(`settings.backup.${format}.importError`, {
      message: error.message
    })
  )
}

interface ProxyListFormatCardProps {
  config: ListFormatConfig
  disabled: boolean
  isExporting: boolean
  isImporting: boolean
  onExport: () => void
  onImport: () => void
}

function ProxyListFormatCard({
  config,
  disabled,
  isExporting,
  isImporting,
  onExport,
  onImport
}: ProxyListFormatCardProps): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const { format, icon, accent, extension } = config
  const cardBusy = isExporting || isImporting

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: '16px',
        bgcolor: surfaceContainer(theme, 'low'),
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5
      }}
    >
      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'flex-start' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: '12px',
            flexShrink: 0,
            bgcolor: withThemeAlpha(theme, accent, theme.palette.mode === 'dark' ? 0.22 : 0.12),
            color: accent
          }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="subtitle2" sx={{ lineHeight: 1.3 }}>
              {t(FORMAT_LABEL_KEYS[format])}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                px: 0.75,
                py: 0.15,
                borderRadius: '12px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                bgcolor: withThemeAlpha(theme, accent, 0.1),
                color: accent
              }}
            >
              {extension}
            </Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            {t(`settings.backup.${format}.formatHint`)}
          </Typography>
        </Box>
      </Stack>

      <Stack spacing={1.25}>
        <Button
          variant="contained"
          fullWidth
          disabled={disabled || cardBusy}
          onClick={onExport}
          startIcon={
            isExporting ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <FileDownloadOutlinedIcon />
            )
          }
        >
          {t(`settings.backup.${format}.export`)}
        </Button>
        <Button
          variant="outlined"
          fullWidth
          disabled={disabled || cardBusy}
          onClick={onImport}
          startIcon={
            isImporting ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <FileUploadOutlinedIcon />
            )
          }
        >
          {t(`settings.backup.${format}.selectFile`)}
        </Button>
      </Stack>
    </Box>
  )
}

function SettingsBackupSection({
  proxies,
  groups,
  onExportSuccess,
  onListExportSuccess,
  onImportSuccess,
  onListImportSuccess,
  onError,
  onReloadData
}: SettingsBackupSectionProps): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const [exportKind, setExportKind] = useState<BackupExportKind>('full')
  const [isExporting, setIsExporting] = useState(false)
  const [isSelectingFile, setIsSelectingFile] = useState(false)
  const [listImportFormat, setListImportFormat] = useState<ProxyListImportFormat | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [preview, setPreview] = useState<BackupPreview | null>(null)
  const [listPreviewOpen, setListPreviewOpen] = useState(false)
  const [listPreview, setListPreview] = useState<ProxyListImportPreview | null>(null)
  const [listPreviewFormat, setListPreviewFormat] = useState<ProxyListImportFormat>('csv')
  const [exportSelectOpen, setExportSelectOpen] = useState(false)
  const [exportSelectMode, setExportSelectMode] = useState<'backup' | ProxyListImportFormat>(
    'backup'
  )
  const [protectWithPassword, setProtectWithPassword] = useState(false)
  const [exportPassword, setExportPassword] = useState('')
  const [exportPasswordConfirm, setExportPasswordConfirm] = useState('')
  const [importPassword, setImportPassword] = useState('')

  const resolveExportPassword = (): string | undefined => {
    if (!protectWithPassword) {
      return undefined
    }

    return exportPassword
  }

  const validateExportPassword = (): boolean => {
    const error = validateBackupExportPassword(
      protectWithPassword,
      exportPassword,
      exportPasswordConfirm
    )

    if (error === 'too_short') {
      onError(t('settings.backup.passwordTooShort', { min: BACKUP_MIN_PASSWORD_LENGTH }))
      return false
    }

    if (error === 'mismatch') {
      onError(t('settings.backup.passwordMismatch'))
      return false
    }

    return true
  }

  const runBackupExport = async (proxyIds?: string[]): Promise<void> => {
    if (!validateExportPassword()) {
      return
    }

    setIsExporting(true)

    try {
      const response = await window.api.exportBackup({
        kind: exportKind,
        proxyIds,
        password: resolveExportPassword()
      })

      if (response.canceled) {
        return
      }

      setExportSelectOpen(false)
      onExportSuccess()
    } catch {
      onError(t('settings.backup.exportError'))
    } finally {
      setIsExporting(false)
    }
  }

  const runListExport = async (
    format: ProxyListImportFormat,
    proxyIds: string[]
  ): Promise<void> => {
    setIsExporting(true)

    try {
      const exportApi = {
        csv: window.api.exportCsv,
        json: window.api.exportJson,
        txt: window.api.exportTxt
      }[format]
      const response = await exportApi({ proxyIds })

      if (response.canceled) {
        return
      }

      setExportSelectOpen(false)
      onListExportSuccess(format)
    } catch {
      onError(t(`settings.backup.${format}.exportError`))
    } finally {
      setIsExporting(false)
    }
  }

  const handleBackupExport = (): void => {
    if (isBusy) {
      return
    }

    if (!validateExportPassword()) {
      return
    }

    if (!includesProxiesInExport(exportKind)) {
      void runBackupExport()
      return
    }

    if (proxies.length === 0) {
      onError(t('settings.backup.exportNoProxies'))
      return
    }

    setExportSelectMode('backup')
    setExportSelectOpen(true)
  }

  const handleListExport = (format: ProxyListImportFormat): void => {
    if (isBusy) {
      return
    }

    if (proxies.length === 0) {
      onError(t(`settings.backup.${format}.exportNoProxies`))
      return
    }

    setExportSelectMode(format)
    setExportSelectOpen(true)
  }

  const handleConfirmExport = async (proxyIds: string[]): Promise<void> => {
    if (exportSelectMode !== 'backup') {
      await runListExport(exportSelectMode, proxyIds)
      return
    }

    await runBackupExport(proxyIds)
  }

  const handleSelectBackupFile = async (): Promise<void> => {
    if (isBusy) return

    setIsSelectingFile(true)

    try {
      const response = await window.api.previewBackup()

      if (response.canceled) {
        return
      }

      if ('error' in response) {
        onError(resolveBackupError(t, response.error))
        return
      }

      setPreview(response.preview)
      setImportPassword('')
      setPreviewOpen(true)
    } catch {
      onError(t('settings.backup.importError', { message: t('settings.backup.errors.unknown') }))
    } finally {
      setIsSelectingFile(false)
    }
  }

  const handleSelectListFile = async (format: ProxyListImportFormat): Promise<void> => {
    if (isBusy) return

    setListImportFormat(format)
    setIsSelectingFile(true)

    try {
      const previewApi = {
        csv: window.api.previewCsvImport,
        json: window.api.previewJsonImport,
        txt: window.api.previewTxtImport
      }[format]
      const response = await previewApi()

      if (response.canceled) {
        return
      }

      if ('error' in response) {
        onError(resolveListImportError(t, format, response.error))
        return
      }

      setListPreviewFormat(format)
      setListPreview(response.preview)
      setListPreviewOpen(true)
    } catch {
      onError(
        t(`settings.backup.${format}.importError`, {
          message: t(`settings.backup.${format}.errors.unknown`)
        })
      )
    } finally {
      setIsSelectingFile(false)
      setListImportFormat(null)
    }
  }

  const handleConfirmBackupImport = async (
    mode: BackupImportMode,
    proxyIds?: string[],
    password?: string
  ): Promise<void> => {
    if (!preview) {
      return
    }

    const response = await window.api.importBackup({
      filePath: preview.filePath,
      mode,
      proxyIds,
      password
    })

    if ('error' in response) {
      onError(resolveBackupError(t, response.error))
      return
    }

    await onReloadData()
    onImportSuccess({
      proxiesAdded: response.result.proxiesAdded,
      groupsAdded: response.result.groupsAdded,
      settingsImported: response.result.settingsImported
    })
  }

  const handleConfirmListImport = async (entryIds: string[], groupId?: string): Promise<void> => {
    if (!listPreview) {
      return
    }

    const importApi = {
      csv: window.api.importCsv,
      json: window.api.importJson,
      txt: window.api.importTxt
    }[listPreviewFormat]
    const response = await importApi({
      filePath: listPreview.filePath,
      entryIds,
      groupId
    })

    if ('error' in response) {
      onError(resolveListImportError(t, listPreviewFormat, response.error))
      return
    }

    await onReloadData()
    onListImportSuccess({
      format: listPreviewFormat,
      proxiesAdded: response.result.added,
      skippedDuplicates: response.result.skippedDuplicates
    })
  }

  const handleClosePreview = (): void => {
    setPreviewOpen(false)
    setPreview(null)
    setImportPassword('')
  }

  const handleCloseListPreview = (): void => {
    setListPreviewOpen(false)
    setListPreview(null)
  }

  const handleCloseExportSelect = (): void => {
    if (isExporting) {
      return
    }

    setExportSelectOpen(false)
  }

  const isBusy = isExporting || isSelectingFile

  const nativeCardSx: SxProps<Theme> = {
    p: { xs: 2, sm: 2.25 },
    borderRadius: '16px',
    bgcolor: surfaceContainer(theme, 'default'),
    backgroundImage: `linear-gradient(135deg, ${withThemeAlpha(theme, theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.08 : 0.05)} 0%, transparent 55%)`
  }

  return (
    <>
      <ContentSection
        icon={<SwapHorizOutlinedIcon fontSize="small" />}
        title={t('settings.sections.backup')}
        description={t('settings.sections.backupDescription')}
        showHeader={false}
      >
        <Stack spacing={3}>
          <Box sx={nativeCardSx}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start', mb: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 44,
                  height: 44,
                  borderRadius: '16px',
                  flexShrink: 0,
                  bgcolor: withThemeAlpha(
                    theme,
                    theme.palette.primary.main,
                    theme.palette.mode === 'dark' ? 0.24 : 0.12
                  ),
                  color: 'primary.main'
                }}
              >
                <ArchiveOutlinedIcon />
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Stack
                  direction="row"
                  spacing={0.75}
                  sx={{ alignItems: 'center', flexWrap: 'wrap' }}
                >
                  <Typography variant="subtitle1">{t('settings.backup.nativeTitle')}</Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      px: 0.75,
                      py: 0.15,
                      borderRadius: '12px',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      bgcolor: withThemeAlpha(theme, theme.palette.primary.main, 0.12),
                      color: 'primary.main'
                    }}
                  >
                    .pcbackup.json
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {t('settings.backup.nativeDescription')}
                </Typography>
              </Box>
            </Stack>

            <Alert
              severity="warning"
              variant="outlined"
              icon={<WarningAmberOutlinedIcon />}
              sx={{ mb: 2 }}
            >
              {t('settings.backup.securityWarning')}
            </Alert>

            <Typography variant="subtitle2" sx={{ mb: 1.25 }}>
              {t('settings.backup.exportKind')}
            </Typography>
            <ToggleButtonGroup
              value={exportKind}
              exclusive
              onChange={(_event, value: BackupExportKind | null) => {
                if (value) {
                  setExportKind(value)
                }
              }}
              fullWidth
              disabled={isBusy}
              sx={{
                mb: 2,
                '& .MuiToggleButton-root': {
                  py: 1.1,
                  px: 1.25,
                  fontSize: '0.82rem'
                }
              }}
            >
              <ToggleButton value="full">{t('settings.backup.exportKindFull')}</ToggleButton>
              <ToggleButton value="proxies">{t('settings.backup.exportKindProxies')}</ToggleButton>
              <ToggleButton value="settings">
                {t('settings.backup.exportKindSettings')}
              </ToggleButton>
            </ToggleButtonGroup>

            <Box sx={{ mb: 2 }}>
              <BackupPasswordFields
                enabled={protectWithPassword}
                onEnabledChange={setProtectWithPassword}
                password={exportPassword}
                onPasswordChange={setExportPassword}
                confirmPassword={exportPasswordConfirm}
                onConfirmPasswordChange={setExportPasswordConfirm}
                disabled={isBusy}
              />
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
              <Button
                variant="contained"
                fullWidth
                disabled={isBusy}
                onClick={handleBackupExport}
                startIcon={
                  isExporting && exportSelectMode === 'backup' ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <FileDownloadOutlinedIcon />
                  )
                }
              >
                {t('settings.backup.export')}
              </Button>
              <Button
                variant="outlined"
                fullWidth
                disabled={isBusy}
                onClick={() => void handleSelectBackupFile()}
                startIcon={
                  isSelectingFile && !listImportFormat ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <FileUploadOutlinedIcon />
                  )
                }
              >
                {t('settings.backup.selectFile')}
              </Button>
            </Stack>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
              {t('settings.backup.formatHint')}
            </Typography>
          </Box>

          <Divider sx={{ '&::before, &::after': { borderColor: outlineVariant(theme) } }}>
            <Typography variant="caption" color="text.secondary" sx={{ px: 1, fontWeight: 600 }}>
              {t('settings.backup.listFormatsTitle')}
            </Typography>
          </Divider>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              {t('settings.backup.listFormatsHeading')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('settings.backup.listFormatsDescription')}
            </Typography>

            <Stack spacing={1.5}>
              {LIST_FORMATS.map((config) => (
                <ProxyListFormatCard
                  key={config.format}
                  config={config}
                  disabled={isBusy}
                  isExporting={isExporting && exportSelectMode === config.format}
                  isImporting={isSelectingFile && listImportFormat === config.format}
                  onExport={() => handleListExport(config.format)}
                  onImport={() => void handleSelectListFile(config.format)}
                />
              ))}
            </Stack>
          </Box>
        </Stack>
      </ContentSection>

      <BackupExportProxiesDialog
        open={exportSelectOpen}
        exportKind={exportSelectMode === 'backup' ? exportKind : 'proxies'}
        proxies={proxies}
        groups={groups}
        isExporting={isExporting}
        onClose={handleCloseExportSelect}
        onConfirm={handleConfirmExport}
      />

      <BackupImportPreviewDialog
        open={previewOpen}
        preview={preview}
        importPassword={importPassword}
        onImportPasswordChange={setImportPassword}
        onPreviewChange={setPreview}
        onClose={handleClosePreview}
        onError={onError}
        onConfirm={handleConfirmBackupImport}
      />

      <CsvImportPreviewDialog
        open={listPreviewOpen}
        format={listPreviewFormat}
        preview={listPreview}
        groups={groups}
        onClose={handleCloseListPreview}
        onError={onError}
        onConfirm={handleConfirmListImport}
      />
    </>
  )
}

export default SettingsBackupSection
