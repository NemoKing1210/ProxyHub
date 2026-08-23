import {
  Box,
  Button,
  CircularProgress,
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
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { BackupImportMode, BackupPreview } from '@shared/types/backup'
import { mapBackupRecordsToGroups, mapBackupRecordsToProxies } from '@shared/utils/backup'
import { formatDateTime } from '@shared/utils/datetime'
import { outlineVariant, surfaceContainer } from '../../../theme'
import BackupProxySelectionList from '../../../components/BackupProxySelectionList'
import { BackupUnlockSection } from '../../../components/BackupPasswordFields'

interface SyncPullPreviewDialogProps {
  open: boolean
  preview: BackupPreview | null
  sessionId: string | null
  importPassword: string
  onImportPasswordChange: (value: string) => void
  onPreviewChange: (preview: BackupPreview) => void
  onClose: () => void
  onError: (message: string) => void
  onConfirm: (mode: BackupImportMode, proxyIds?: string[], password?: string) => Promise<void>
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

function resolveSyncError(
  t: (key: string, options?: Record<string, unknown>) => string,
  error: { code: string; message: string }
): string {
  const messageKey = `settings.sync.errors.${error.code}`
  const localized = t(messageKey, { defaultValue: '' })

  return (
    localized ||
    t('settings.sync.pullError', {
      message: error.message
    })
  )
}

function SyncPullPreviewDialog({
  open,
  preview,
  sessionId,
  importPassword,
  onImportPasswordChange,
  onPreviewChange,
  onClose,
  onError,
  onConfirm
}: SyncPullPreviewDialogProps): React.JSX.Element {
  const { t, i18n } = useTranslation()
  const theme = useTheme()
  const [importMode, setImportMode] = useState<BackupImportMode>('merge')
  const [isImporting, setIsImporting] = useState(false)
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [unlockError, setUnlockError] = useState<string | undefined>()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())

  const isLocked = preview?.encrypted === true && preview.decrypted !== true

  const backupProxies = useMemo(
    () => (preview && !isLocked ? mapBackupRecordsToProxies(preview.backupProxies) : []),
    [preview, isLocked]
  )

  const backupGroups = useMemo(
    () => (preview && !isLocked ? mapBackupRecordsToGroups(preview.backupGroups) : []),
    [preview, isLocked]
  )

  useEffect(() => {
    if (!open || !preview || isLocked) {
      return
    }

    setImportMode('merge')
    setIsImporting(false)
    setUnlockError(undefined)
    setSelectedIds(new Set(preview.backupProxies.map((proxy) => proxy.id)))
  }, [open, preview?.exportedAt, preview, isLocked])

  useEffect(() => {
    if (!open) {
      setUnlockError(undefined)
      setIsUnlocking(false)
    }
  }, [open])

  const handleClose = (): void => {
    if (isImporting || isUnlocking) {
      return
    }

    onClose()
  }

  const handleUnlock = async (): Promise<void> => {
    if (!preview || !sessionId || isUnlocking) {
      return
    }

    setIsUnlocking(true)
    setUnlockError(undefined)

    try {
      const response = await window.api.unlockSyncPullPreview(sessionId, importPassword)

      if (!response.ok) {
        setUnlockError(resolveSyncError(t, response.error))
        return
      }

      onPreviewChange(response.preview)
    } catch {
      onError(t('settings.sync.pullError', { message: t('settings.sync.errors.unknown') }))
    } finally {
      setIsUnlocking(false)
    }
  }

  const handleConfirm = async (): Promise<void> => {
    if (!preview || isImporting || isLocked) {
      return
    }

    const includesProxies = preview.kind === 'full' || preview.kind === 'proxies'

    if (includesProxies && selectedIds.size === 0) {
      return
    }

    setIsImporting(true)

    try {
      await onConfirm(
        importMode,
        includesProxies ? [...selectedIds] : undefined,
        preview.encrypted ? importPassword : undefined
      )
      onClose()
    } finally {
      setIsImporting(false)
    }
  }

  const includesProxies = preview?.kind === 'full' || preview?.kind === 'proxies'
  const includesSettings = preview?.hasSettings
  const canImport = !isLocked && (!includesProxies || selectedIds.size > 0)

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      slotProps={{
        backdrop: {
          sx: { backdropFilter: 'blur(4px)' }
        }
      }}
    >
      <DialogTitle>{t('settings.sync.pullPreviewTitle')}</DialogTitle>

      <DialogContent>
        {preview && (
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              {isLocked
                ? t('settings.backup.previewDescriptionEncrypted')
                : t('settings.sync.pullPreviewDescription')}
            </Typography>

            <Box
              sx={{
                px: 1.75,
                py: 0.5,
                borderRadius: '16px',
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
              {preview.encrypted && (
                <>
                  <Divider />
                  <PreviewRow
                    label={t('settings.backup.previewEncryption')}
                    value={t('settings.backup.previewEncrypted')}
                  />
                </>
              )}
            </Box>

            {isLocked ? (
              <BackupUnlockSection
                password={importPassword}
                onPasswordChange={(value) => {
                  onImportPasswordChange(value)
                  if (unlockError) {
                    setUnlockError(undefined)
                  }
                }}
                onUnlock={handleUnlock}
                isUnlocking={isUnlocking}
                error={unlockError}
                disabled={isImporting}
              />
            ) : (
              <>
                {includesProxies && (
                  <Box
                    sx={{
                      px: 1.75,
                      py: 0.5,
                      borderRadius: '16px',
                      bgcolor: surfaceContainer(theme, 'low'),
                      boxShadow: `inset 0 0 0 1px ${outlineVariant(theme)}`
                    }}
                  >
                    <PreviewRow
                      label={t('settings.backup.previewProxies')}
                      value={preview.proxyCount}
                    />
                    <Divider />
                    <PreviewRow
                      label={t('settings.backup.previewGroups')}
                      value={preview.groupCount}
                    />
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
                      borderRadius: '16px',
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

                {includesProxies && backupProxies.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                      {t('settings.backup.importSelectProxies')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                      {t('settings.backup.importSelectProxiesHint')}
                    </Typography>
                    <BackupProxySelectionList
                      proxies={backupProxies}
                      groups={backupGroups}
                      selectedIds={selectedIds}
                      onSelectedIdsChange={setSelectedIds}
                      disabled={isImporting}
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
                    <ToggleButton value="merge">
                      {t('settings.backup.importModeMerge')}
                    </ToggleButton>
                    <ToggleButton value="replace">
                      {t('settings.backup.importModeReplace')}
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              </>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={handleClose} disabled={isImporting || isUnlocking}>
          {t('common.cancel')}
        </Button>
        {!isLocked && (
          <Button
            variant="contained"
            onClick={() => void handleConfirm()}
            disabled={!preview || isImporting || !canImport}
            startIcon={isImporting ? <CircularProgress size={18} color="inherit" /> : undefined}
          >
            {t('settings.sync.pullConfirm')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default SyncPullPreviewDialog
