import CloseIcon from '@mui/icons-material/Close'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import IosShareOutlinedIcon from '@mui/icons-material/IosShareOutlined'
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { QRCodeCanvas } from 'qrcode.react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Proxy } from '../../../shared/types/proxy'
import { buildProxyUrl, formatProxyAddress } from '../../../shared/utils/proxy-format'
import { buildProxyShareChannels, type ShareChannelNetwork } from '../utils/proxy-share-channels'
import { trySystemShare } from '../utils/share-proxy'
import CopyableField from './CopyableField'
import ShareNetworkIcon from './ShareNetworkIcon'

interface ProxyShareDialogProps {
  open: boolean
  proxy?: Proxy
  onClose: () => void
}

function ShareChannelIcon({ network }: { network: ShareChannelNetwork }): React.JSX.Element {
  if (network === 'email') {
    return <EmailOutlinedIcon />
  }

  if (network === 'system') {
    return <IosShareOutlinedIcon />
  }

  return <ShareNetworkIcon network={network} />
}

function ShareChannelButton({
  label,
  color,
  icon,
  onClick
}: {
  label: string
  color: string
  icon: React.ReactNode
  onClick: () => void
}): React.JSX.Element {
  return (
    <Button
      variant="text"
      onClick={onClick}
      sx={{
        flexDirection: 'column',
        gap: 1,
        py: 1.25,
        px: 1,
        minWidth: 0,
        borderRadius: 2.5,
        textTransform: 'none',
        color: 'text.primary',
        '&:hover': {
          bgcolor: alpha(color, 0.08)
        }
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 52,
          height: 52,
          borderRadius: '50%',
          bgcolor: color,
          color: '#fff'
        }}
      >
        {icon}
      </Box>
      <Typography variant="caption" sx={{ fontWeight: 600, lineHeight: 1.2, textAlign: 'center' }}>
        {label}
      </Typography>
    </Button>
  )
}

function ProxyShareDialog({ open, proxy, onClose }: ProxyShareDialogProps): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const [systemShareAvailable, setSystemShareAvailable] = useState(false)

  const title = proxy?.label?.trim() || (proxy ? formatProxyAddress(proxy) : '')
  const proxyUrl = proxy ? buildProxyUrl(proxy) : ''

  useEffect(() => {
    if (!open) {
      return
    }

    const shareData: ShareData = { title, text: proxyUrl }
    const available =
      typeof navigator.share === 'function' &&
      (typeof navigator.canShare !== 'function' || navigator.canShare(shareData))

    setSystemShareAvailable(available)
  }, [open, proxyUrl, title])

  const handleSystemShare = useCallback(async (): Promise<void> => {
    try {
      const shared = await trySystemShare({ title, text: proxyUrl })

      if (shared) {
        onClose()
      }
    } catch {
      // User dismissed the native share dialog.
    }
  }, [onClose, proxyUrl, title])

  const channels = useMemo(() => {
    if (!proxy) {
      return []
    }

    return buildProxyShareChannels({
      t,
      title,
      proxyUrl,
      systemShareAvailable,
      systemColor: theme.palette.secondary.main,
      onSystemShare: () => void handleSystemShare()
    }).filter((channel) => !channel.hidden)
  }, [
    handleSystemShare,
    proxy,
    proxyUrl,
    systemShareAvailable,
    t,
    theme.palette.secondary.main,
    title
  ])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      slotProps={{
        backdrop: {
          sx: { backdropFilter: 'blur(4px)' }
        }
      }}
    >
      <DialogTitle
        sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" component="span" sx={{ display: 'block', fontWeight: 700 }}>
            {t('proxyList.shareDialog.title')}
          </Typography>
          {title ? (
            <Typography variant="body2" color="text.secondary" noWrap>
              {title}
            </Typography>
          ) : null}
        </Box>
        <IconButton onClick={onClose} aria-label={t('common.cancel')} sx={{ mt: -0.5, mr: -0.5 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 0 }}>
        <Stack spacing={2.5}>
          <CopyableField label={t('proxyList.columns.proxyUrl')} value={proxyUrl} monospace />

          <Stack spacing={1.25} sx={{ alignItems: 'center' }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 3,
                bgcolor: '#fff',
                boxShadow: `inset 0 0 0 1px ${alpha(theme.palette.common.black, 0.06)}`
              }}
            >
              <QRCodeCanvas
                value={proxyUrl}
                size={196}
                level="M"
                includeMargin
                bgColor="#FFFFFF"
                fgColor="#000000"
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              {t('proxyList.shareDialog.qrHint')}
            </Typography>
          </Stack>

          <Box>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ display: 'block', mb: 1, letterSpacing: 0.8 }}
            >
              {t('proxyList.shareDialog.channelsTitle')}
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                gap: 0.5
              }}
            >
              {channels.map((channel) => (
                <ShareChannelButton
                  key={channel.id}
                  label={channel.label}
                  color={channel.color}
                  icon={<ShareChannelIcon network={channel.network} />}
                  onClick={() => void channel.onClick()}
                />
              ))}
            </Box>
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  )
}

export default ProxyShareDialog
