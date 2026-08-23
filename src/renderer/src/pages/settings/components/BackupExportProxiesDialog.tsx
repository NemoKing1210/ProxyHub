import CloseIcon from '@mui/icons-material/Close'
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { BackupExportKind } from '@shared/types/backup'
import type { Proxy } from '@shared/types/proxy'
import type { ProxyGroup } from '@shared/types/proxy-group'
import BackupProxySelectionList from '../../../components/BackupProxySelectionList'

interface BackupExportProxiesDialogProps {
  open: boolean
  exportKind: BackupExportKind
  proxies: Proxy[]
  groups: ProxyGroup[]
  isExporting: boolean
  onClose: () => void
  onConfirm: (proxyIds: string[]) => Promise<void>
}

function BackupExportProxiesDialog({
  open,
  exportKind,
  proxies,
  groups,
  isExporting,
  onClose,
  onConfirm
}: BackupExportProxiesDialogProps): React.JSX.Element {
  const { t } = useTranslation()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const includesSettings = exportKind === 'full'

  useEffect(() => {
    if (!open) {
      return
    }

    setSelectedIds(new Set(proxies.map((proxy) => proxy.id)))
  }, [open, proxies])

  const handleClose = (): void => {
    if (isExporting) {
      return
    }

    onClose()
  }

  const handleConfirm = async (): Promise<void> => {
    if (isExporting || selectedIds.size === 0) {
      return
    }

    await onConfirm([...selectedIds])
  }

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
      <DialogTitle sx={{ pr: 6 }}>
        {t('settings.backup.exportSelectTitle')}
        <IconButton
          aria-label={t('common.cancel')}
          onClick={handleClose}
          disabled={isExporting}
          sx={{ position: 'absolute', right: 12, top: 12 }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 0 }}>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            {includesSettings
              ? t('settings.backup.exportSelectDescriptionFull')
              : t('settings.backup.exportSelectDescription')}
          </Typography>

          <BackupProxySelectionList
            proxies={proxies}
            groups={groups}
            selectedIds={selectedIds}
            onSelectedIdsChange={setSelectedIds}
            disabled={isExporting}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={handleClose} disabled={isExporting}>
          {t('common.cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={() => void handleConfirm()}
          disabled={isExporting || selectedIds.size === 0}
          startIcon={isExporting ? <CircularProgress size={18} color="inherit" /> : undefined}
        >
          {t('settings.backup.exportSelectConfirm')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default BackupExportProxiesDialog
