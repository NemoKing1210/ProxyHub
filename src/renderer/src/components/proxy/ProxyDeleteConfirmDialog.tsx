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
import type { Proxy } from '@shared/types/proxy'
import { formatProxyAddress } from '@shared/utils/proxy-format'

interface ProxyDeleteConfirmDialogProps {
  open: boolean
  proxy?: Proxy
  onClose: () => void
  onConfirm: (proxyId: string) => Promise<void>
}

function ProxyDeleteConfirmDialog({
  open,
  proxy,
  onClose,
  onConfirm
}: ProxyDeleteConfirmDialogProps): React.JSX.Element {
  const { t } = useTranslation()
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!open) {
      setIsDeleting(false)
    }
  }, [open])

  const displayName = proxy ? proxy.label?.trim() || formatProxyAddress(proxy) : ''

  const handleClose = (): void => {
    if (isDeleting) {
      return
    }

    onClose()
  }

  const handleConfirm = async (): Promise<void> => {
    if (!proxy || isDeleting) {
      return
    }

    setIsDeleting(true)

    try {
      await onConfirm(proxy.id)
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
      <DialogTitle>{t('proxyList.deleteConfirm.title')}</DialogTitle>

      <DialogContent>
        <DialogContentText>
          {t('proxyList.deleteConfirm.message', { name: displayName })}
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
          disabled={!proxy || isDeleting}
        >
          {t('common.delete')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ProxyDeleteConfirmDialog
