import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ProxyGroup } from '@shared/types/proxy-group'

interface ProxyGroupDeleteConfirmDialogProps {
  open: boolean
  group?: ProxyGroup
  proxyCount: number
  onClose: () => void
  onConfirm: (groupId: string) => Promise<void>
}

function ProxyGroupDeleteConfirmDialog({
  open,
  group,
  proxyCount,
  onClose,
  onConfirm
}: ProxyGroupDeleteConfirmDialogProps): React.JSX.Element {
  const { t } = useTranslation()
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!open) {
      setIsDeleting(false)
    }
  }, [open])

  const handleClose = (): void => {
    if (isDeleting) {
      return
    }

    onClose()
  }

  const handleConfirm = async (): Promise<void> => {
    if (!group || isDeleting) {
      return
    }

    setIsDeleting(true)

    try {
      await onConfirm(group.id)
      onClose()
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="xs"
      slotProps={{
        backdrop: {
          sx: { backdropFilter: 'blur(4px)' }
        }
      }}
    >
      <DialogTitle>{t('proxyGroup.deleteConfirm.title')}</DialogTitle>

      <DialogContent>
        <DialogContentText>
          {proxyCount > 0
            ? t('proxyGroup.deleteConfirm.messageWithProxies', {
                name: group?.name ?? '',
                count: proxyCount
              })
            : t('proxyGroup.deleteConfirm.message', { name: group?.name ?? '' })}
        </DialogContentText>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
        <Button onClick={handleClose} disabled={isDeleting}>
          {t('common.cancel')}
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={() => void handleConfirm()}
          disabled={!group || isDeleting}
        >
          {t('common.delete')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ProxyGroupDeleteConfirmDialog
