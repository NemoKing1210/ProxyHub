import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { BackupImportMode, BackupPreview } from '../../../shared/types/backup'
import { formatDateTime } from '../../../shared/utils/datetime'
import { outlineVariant, surfaceContainer } from '../theme'

interface BackupImportPreviewDialogProps {
  open: boolean
  preview: BackupPreview | null
  onClose: () => void
  onConfirm: (mode: BackupImportMode) => Promise<void>
}

interface PreviewRowProps {
  label: string
  value: React.ReactNode
}

function PreviewRow({ label, value }: PreviewRowProps): React.JSX.Element {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'minmax(140px, 42%) 1fr' },
        gap: { xs: 0.35, sm: 1.5 },
        py: 0.85
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500, wordBreak: 'break-word' }}>
        {value}
      </Typography>
    </Box>
  )
}

function BackupImportPreviewDialog({
  open,
  preview,
  onClose,
  onConfirm
}: BackupImportPreviewDialogProps): React.JSX.Element {
  const { t, i18n } = useTranslation()
  const theme = useTheme()
  const [importMode, setImportMode] = useState<BackupImportMode>('merge')
  const [isImporting, setIsImporting] = useState(false)

  useEffect(() => {
    if (open) {
      setImportMode('merge')
      setIsImporting(false)
    }
  }, [open, preview?.filePath])

  const handleClose = (): void => {
    if (isImporting) {
      return
    }

    onClose()
  }

  const handleConfirm = async (): Promise<void> => {
    if (!preview || isImporting) {
      return
    }

    setIsImporting(true)

    try {
      await onConfirm(importMode)
      onClose()
    } finally {
      setIsImporting(false)
    }
  }

  const includesProxies = preview?.kind === 'full' || preview?.kind === 'proxies'
  const includesSettings = preview?.hasSettings

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        backdrop: {
          sx: { backdropFilter: 'blur(4px)' }
        }
      }}
    >
      <DialogTitle>{t('settings.backup.previewTitle')}</DialogTitle>

      <DialogContent>
        {preview && (
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              {t('settings.backup.previewDescription')}
            </Typography>

            <Box
              sx={{
                px: 1.75,
                py: 0.5,
                borderRadius: 2.5,
                bgcolor: surfaceContainer(theme, 'low'),
                boxShadow: `inset 0 0 0 1px ${outlineVariant(theme)}`
              }}
            >
              <PreviewRow label={t('settings.backup.previewFile')} value={preview.fileName} />
              <Divider />
              <PreviewRow
                label={t('settings.backup.previewSchemaVersion')}
                value={`v${preview.schemaVersion}`}
              />
              <Divider />
              <PreviewRow
                label={t('settings.backup.previewAppVersion')}
                value={preview.appVersion}
              />
              <Divider />
              <PreviewRow
                label={t('settings.backup.previewExportedAt')}
                value={formatDateTime(preview.exportedAt, i18n.language)}
              />
              <Divider />
              <PreviewRow
                label={t('settings.backup.previewKind')}
                value={t(`settings.backup.kindLabels.${preview.kind}`)}
              />
            </Box>

            {includesProxies && (
              <Box
                sx={{
                  px: 1.75,
                  py: 0.5,
                  borderRadius: 2.5,
                  bgcolor: surfaceContainer(theme, 'low'),
                  boxShadow: `inset 0 0 0 1px ${outlineVariant(theme)}`
                }}
              >
                <PreviewRow
                  label={t('settings.backup.previewProxies')}
                  value={preview.proxyCount}
                />
                <Divider />
                <PreviewRow label={t('settings.backup.previewGroups')} value={preview.groupCount} />
                <Divider />
                <PreviewRow
                  label={t('settings.backup.previewFavorites')}
                  value={preview.favoriteCount}
                />
                <Divider />
                <PreviewRow
                  label={t('settings.backup.previewEnabledProxies')}
                  value={preview.enabledProxyCount}
                />
              </Box>
            )}

            {includesSettings && (
              <Box
                sx={{
                  px: 1.75,
                  py: 0.5,
                  borderRadius: 2.5,
                  bgcolor: surfaceContainer(theme, 'low'),
                  boxShadow: `inset 0 0 0 1px ${outlineVariant(theme)}`
                }}
              >
                <PreviewRow
                  label={t('settings.backup.previewSettings')}
                  value={t('settings.backup.previewSettingsIncluded')}
                />
                <Divider />
                <PreviewRow
                  label={t('settings.backup.previewCheckDomains')}
                  value={preview.checkDomainCount}
                />
                <Divider />
                <PreviewRow
                  label={t('settings.backup.previewAutoCheck')}
                  value={
                    preview.autoCheckEnabled
                      ? t('settings.backup.previewEnabled')
                      : t('settings.backup.previewDisabled')
                  }
                />
              </Box>
            )}

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                {t('settings.backup.importMode')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.25 }}>
                {importMode === 'replace'
                  ? t('settings.backup.importModeReplaceHint')
                  : t('settings.backup.importModeMergeHint')}
              </Typography>
              <ToggleButtonGroup
                value={importMode}
                exclusive
                onChange={(_event, value: BackupImportMode | null) => {
                  if (value) {
                    setImportMode(value)
                  }
                }}
                fullWidth
                disabled={isImporting}
                sx={{
                  '& .MuiToggleButton-root': {
                    py: 1.05
                  }
                }}
              >
                <ToggleButton value="merge">{t('settings.backup.importModeMerge')}</ToggleButton>
                <ToggleButton value="replace">{t('settings.backup.importModeReplace')}</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={handleClose} disabled={isImporting}>
          {t('common.cancel')}
        </Button>
        <Button variant="contained" onClick={() => void handleConfirm()} disabled={!preview || isImporting}>
          {t('settings.backup.previewConfirm')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default BackupImportPreviewDialog
