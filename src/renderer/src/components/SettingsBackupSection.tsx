import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined'
import SwapHorizOutlinedIcon from '@mui/icons-material/SwapHorizOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { BackupExportKind, BackupImportMode, BackupPreview } from '../../../shared/types/backup'
import type { CsvImportPreview, ProxyImportFormat } from '../../../shared/types/proxy-import'
import type { Proxy } from '../../../shared/types/proxy'
import type { ProxyGroup } from '../../../shared/types/proxy-group'
import BackupExportProxiesDialog from './BackupExportProxiesDialog'
import BackupImportPreviewDialog from './BackupImportPreviewDialog'
import BackupPasswordFields, { validateBackupExportPassword } from './BackupPasswordFields'
import ContentSection from './ContentSection'
import CsvImportPreviewDialog from './CsvImportPreviewDialog'
import { outlineVariant, surfaceContainer } from '../theme'
import { BACKUP_MIN_PASSWORD_LENGTH } from '../../../shared/constants/backup-crypto'

interface SettingsBackupSectionProps {
  proxies: Proxy[]
  groups: ProxyGroup[]
  onExportSuccess: () => void
  onCsvExportSuccess: () => void
  onImportSuccess: (summary: {
    proxiesAdded: number
    groupsAdded: number
    settingsImported: boolean
  }) => void
  onCsvImportSuccess: (summary: { proxiesAdded: number; skippedDuplicates: number }) => void
  onError: (message: string) => void
  onReloadData: () => Promise<void>
}

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

function resolveCsvError(
  t: (key: string, options?: Record<string, unknown>) => string,
  error: { code: string; message: string }
): string {
  const messageKey = `settings.backup.csv.errors.${error.code}`
  const localized = t(messageKey, { defaultValue: '' })

  return (
    localized ||
    t('settings.backup.csv.importError', {
      message: error.message
    })
  )
}

function SettingsBackupSection({
  proxies,
  groups,
  onExportSuccess,
  onCsvExportSuccess,
  onImportSuccess,
  onCsvImportSuccess,
  onError,
  onReloadData
}: SettingsBackupSectionProps): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const [importFormat, setImportFormat] = useState<ProxyImportFormat>('backup')
  const [exportKind, setExportKind] = useState<BackupExportKind>('full')
  const [isExporting, setIsExporting] = useState(false)
  const [isSelectingFile, setIsSelectingFile] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [preview, setPreview] = useState<BackupPreview | null>(null)
  const [csvPreviewOpen, setCsvPreviewOpen] = useState(false)
  const [csvPreview, setCsvPreview] = useState<CsvImportPreview | null>(null)
  const [exportSelectOpen, setExportSelectOpen] = useState(false)
  const [exportSelectMode, setExportSelectMode] = useState<'backup' | 'csv'>('backup')
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

  const runCsvExport = async (proxyIds: string[]): Promise<void> => {
    setIsExporting(true)

    try {
      const response = await window.api.exportCsv({ proxyIds })

      if (response.canceled) {
        return
      }

      setExportSelectOpen(false)
      onCsvExportSuccess()
    } catch {
      onError(t('settings.backup.csv.exportError'))
    } finally {
      setIsExporting(false)
    }
  }

  const handleExport = (): void => {
    if (isExporting || isSelectingFile) {
      return
    }

    if (importFormat === 'csv') {
      if (proxies.length === 0) {
        onError(t('settings.backup.csv.exportNoProxies'))
        return
      }

      setExportSelectMode('csv')
      setExportSelectOpen(true)
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

  const handleConfirmExport = async (proxyIds: string[]): Promise<void> => {
    if (exportSelectMode === 'csv') {
      await runCsvExport(proxyIds)
      return
    }

    await runBackupExport(proxyIds)
  }

  const handleSelectBackupFile = async (): Promise<void> => {
    if (isExporting || isSelectingFile) return

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

  const handleSelectCsvFile = async (): Promise<void> => {
    if (isExporting || isSelectingFile) return

    setIsSelectingFile(true)

    try {
      const response = await window.api.previewCsvImport()

      if (response.canceled) {
        return
      }

      if ('error' in response) {
        onError(resolveCsvError(t, response.error))
        return
      }

      setCsvPreview(response.preview)
      setCsvPreviewOpen(true)
    } catch {
      onError(t('settings.backup.csv.importError', { message: t('settings.backup.csv.errors.unknown') }))
    } finally {
      setIsSelectingFile(false)
    }
  }

  const handleSelectFile = (): void => {
    if (importFormat === 'csv') {
      void handleSelectCsvFile()
      return
    }

    void handleSelectBackupFile()
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

  const handleConfirmCsvImport = async (entryIds: string[], groupId?: string): Promise<void> => {
    if (!csvPreview) {
      return
    }

    const response = await window.api.importCsv({
      filePath: csvPreview.filePath,
      entryIds,
      groupId
    })

    if ('error' in response) {
      onError(resolveCsvError(t, response.error))
      return
    }

    await onReloadData()
    onCsvImportSuccess({
      proxiesAdded: response.result.added,
      skippedDuplicates: response.result.skippedDuplicates
    })
  }

  const handleClosePreview = (): void => {
    setPreviewOpen(false)
    setPreview(null)
    setImportPassword('')
  }

  const handleCloseCsvPreview = (): void => {
    setCsvPreviewOpen(false)
    setCsvPreview(null)
  }

  const handleCloseExportSelect = (): void => {
    if (isExporting) {
      return
    }

    setExportSelectOpen(false)
  }

  const isBusy = isExporting || isSelectingFile
  const isBackupFormat = importFormat === 'backup'

  return (
    <>
      <ContentSection
        icon={<SwapHorizOutlinedIcon fontSize="small" />}
        title={t('settings.sections.backup')}
        description={t('settings.sections.backupDescription')}
        collapsible
        defaultExpanded={false}
      >
        <Stack spacing={2.5}>
          <Typography variant="subtitle2">{t('settings.backup.format')}</Typography>
          <ToggleButtonGroup
            value={importFormat}
            exclusive
            onChange={(_event, value: ProxyImportFormat | null) => {
              if (value) {
                setImportFormat(value)
              }
            }}
            fullWidth
            disabled={isBusy}
            sx={{
              '& .MuiToggleButton-root': {
                py: 1.1,
                px: 1.25,
                fontSize: '0.82rem'
              }
            }}
          >
            <ToggleButton value="backup">{t('settings.backup.formatBackup')}</ToggleButton>
            <ToggleButton value="csv">{t('settings.backup.formatCsv')}</ToggleButton>
          </ToggleButtonGroup>

          {isBackupFormat ? (
            <Alert severity="warning" variant="outlined" icon={<WarningAmberOutlinedIcon />}>
              {t('settings.backup.securityWarning')}
            </Alert>
          ) : (
            <Alert severity="info" variant="outlined">
              {t('settings.backup.csv.formatHint')}
            </Alert>
          )}

          <Box
            sx={{
              p: 2,
              borderRadius: 2.5,
              bgcolor: surfaceContainer(theme, 'low'),
              boxShadow: `inset 0 0 0 1px ${outlineVariant(theme)}`
            }}
          >
            {isBackupFormat && (
              <>
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
                  <ToggleButton value="settings">{t('settings.backup.exportKindSettings')}</ToggleButton>
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
              </>
            )}

            <Button
              variant="contained"
              startIcon={
                isExporting ? <CircularProgress size={18} color="inherit" /> : <FileDownloadOutlinedIcon />
              }
              onClick={handleExport}
              disabled={isBusy}
              fullWidth
            >
              {isBackupFormat ? t('settings.backup.export') : t('settings.backup.csv.export')}
            </Button>
          </Box>

          <Box
            sx={{
              p: 2,
              borderRadius: 2.5,
              bgcolor: surfaceContainer(theme, 'low'),
              boxShadow: `inset 0 0 0 1px ${outlineVariant(theme)}`
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              {t('settings.backup.importTitle')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              {isBackupFormat ? t('settings.backup.importHint') : t('settings.backup.csv.importHint')}
            </Typography>

            <Button
              variant="outlined"
              startIcon={
                isSelectingFile ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <FileUploadOutlinedIcon />
                )
              }
              onClick={handleSelectFile}
              disabled={isBusy}
              fullWidth
            >
              {isBackupFormat ? t('settings.backup.selectFile') : t('settings.backup.csv.selectFile')}
            </Button>
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {isBackupFormat ? t('settings.backup.formatHint') : t('settings.backup.csv.formatDescription')}
          </Typography>
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
        open={csvPreviewOpen}
        preview={csvPreview}
        groups={groups}
        onClose={handleCloseCsvPreview}
        onError={onError}
        onConfirm={handleConfirmCsvImport}
      />
    </>
  )
}

export default SettingsBackupSection
