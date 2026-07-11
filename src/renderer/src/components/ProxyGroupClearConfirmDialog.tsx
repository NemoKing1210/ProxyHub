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
import type { ProxyGroup } from '../../../shared/types/proxy-group'

interface ProxyGroupClearConfirmDialogProps {
  open: boolean
  group?: ProxyGroup
  proxyCount: number
  onClose: () => void
  onConfirm: (groupId: string) => Promise<void>
}

function ProxyGroupClearConfirmDialog({
  open,
  group,
  proxyCount,
  onClose,
  onConfirm
}: ProxyGroupClearConfirmDialogProps): React.JSX.Element {
  const { t } = useTranslation()
  const [isClearing, setIsClearing] = useState(false)

  useEffect(() => {
    if (!open) {
      setIsClearing(false)
    }
  }, [open])

  const handleClose = (): void => {
    if (isClearing) {
      return
    }

    onClose()
  }

  const handleConfirm = async (): Promise<void> => {
    if (!group || isClearing || proxyCount === 0) {
      return
    }

    setIsClearing(true)

    try {
      await onConfirm(group.id)
      onClose()
    } finally {
      setIsClearing(false)
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
      <DialogTitle>{t('proxyGroup.clearConfirm.title')}</DialogTitle>

      <DialogContent>
        <DialogContentText>
          {t('proxyGroup.clearConfirm.message', {
            name: group?.name ?? '',
            count: proxyCount
          })}
        </DialogContentText>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
        <Button onClick={handleClose} disabled={isClearing}>
          {t('common.cancel')}
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={() => void handleConfirm()}
          disabled={!group || isClearing || proxyCount === 0}
        >
          {t('proxyGroup.clearConfirm.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ProxyGroupClearConfirmDialog
