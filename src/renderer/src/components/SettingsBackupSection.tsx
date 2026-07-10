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
import BackupImportPreviewDialog from './BackupImportPreviewDialog'
import ContentSection from './ContentSection'
import { outlineVariant, surfaceContainer } from '../theme'

interface SettingsBackupSectionProps {
  onExportSuccess: () => void
  onImportSuccess: (summary: {
    proxiesAdded: number
    groupsAdded: number
    settingsImported: boolean
  }) => void
  onError: (message: string) => void
  onReloadData: () => Promise<void>
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

function SettingsBackupSection({
  onExportSuccess,
  onImportSuccess,
  onError,
  onReloadData
}: SettingsBackupSectionProps): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const [exportKind, setExportKind] = useState<BackupExportKind>('full')
  const [isExporting, setIsExporting] = useState(false)
  const [isSelectingFile, setIsSelectingFile] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [preview, setPreview] = useState<BackupPreview | null>(null)

  const handleExport = async (): Promise<void> => {
    if (isExporting || isSelectingFile) return

    setIsExporting(true)

    try {
      const response = await window.api.exportBackup(exportKind)

      if (response.canceled) {
        return
      }

      onExportSuccess()
    } catch {
      onError(t('settings.backup.exportError'))
    } finally {
      setIsExporting(false)
    }
  }

  const handleSelectFile = async (): Promise<void> => {
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
      setPreviewOpen(true)
    } catch {
      onError(t('settings.backup.importError', { message: t('settings.backup.errors.unknown') }))
    } finally {
      setIsSelectingFile(false)
    }
  }

  const handleConfirmImport = async (mode: BackupImportMode): Promise<void> => {
    if (!preview) {
      return
    }

    const response = await window.api.importBackup({
      filePath: preview.filePath,
      mode
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

  const handleClosePreview = (): void => {
    setPreviewOpen(false)
    setPreview(null)
  }

  const isBusy = isExporting || isSelectingFile

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
          <Alert severity="warning" variant="outlined" icon={<WarningAmberOutlinedIcon />}>
            {t('settings.backup.securityWarning')}
          </Alert>

          <Box
            sx={{
              p: 2,
              borderRadius: 2.5,
              bgcolor: surfaceContainer(theme, 'low'),
              boxShadow: `inset 0 0 0 1px ${outlineVariant(theme)}`
            }}
          >
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

            <Button
              variant="contained"
              startIcon={
                isExporting ? <CircularProgress size={18} color="inherit" /> : <FileDownloadOutlinedIcon />
              }
              onClick={() => void handleExport()}
              disabled={isBusy}
              fullWidth
            >
              {t('settings.backup.export')}
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
              {t('settings.backup.importHint')}
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
              onClick={() => void handleSelectFile()}
              disabled={isBusy}
              fullWidth
            >
              {t('settings.backup.selectFile')}
            </Button>
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {t('settings.backup.formatHint')}
          </Typography>
        </Stack>
      </ContentSection>

      <BackupImportPreviewDialog
        open={previewOpen}
        preview={preview}
        onClose={handleClosePreview}
        onConfirm={handleConfirmImport}
      />
    </>
  )
}

export default SettingsBackupSection
