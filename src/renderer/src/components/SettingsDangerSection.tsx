import DeleteSweepOutlinedIcon from '@mui/icons-material/DeleteSweepOutlined'
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined'
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ContentSection from './ui/ContentSection'
import SettingsCardList from './settings/SettingsCardList'
import { getPalette, withThemeAlpha } from '../theme'

interface SettingsDangerSectionProps {
  proxyCount: number
  groupCount: number
  disabled?: boolean
  onDeleteAll: () => Promise<void>
  onResetSettings: () => Promise<void>
}

type ConfirmKind = 'deleteAll' | 'resetSettings'

function SettingsDangerSection({
  proxyCount,
  groupCount,
  disabled = false,
  onDeleteAll,
  onResetSettings
}: SettingsDangerSectionProps): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const [confirmKind, setConfirmKind] = useState<ConfirmKind | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const hasProxyData = proxyCount > 0 || groupCount > 0

  useEffect(() => {
    if (!confirmKind) {
      setIsProcessing(false)
    }
  }, [confirmKind])

  const handleCloseConfirm = (): void => {
    if (isProcessing) {
      return
    }

    setConfirmKind(null)
  }

  const handleConfirm = async (): Promise<void> => {
    if (!confirmKind || isProcessing) {
      return
    }

    setIsProcessing(true)

    try {
      if (confirmKind === 'deleteAll') {
        await onDeleteAll()
      } else {
        await onResetSettings()
      }

      setConfirmKind(null)
    } finally {
      setIsProcessing(false)
    }
  }

  const confirmTitle =
    confirmKind === 'deleteAll'
      ? t('settings.dangerZone.deleteAllConfirmTitle')
      : t('settings.dangerZone.resetSettingsConfirmTitle')

  const confirmMessage =
    confirmKind === 'deleteAll'
      ? t('settings.dangerZone.deleteAllConfirmMessage', {
          proxies: proxyCount,
          groups: groupCount
        })
      : t('settings.dangerZone.resetSettingsConfirmMessage')

  const palette = getPalette(theme)
  const isDark = theme.palette.mode === 'dark'

  const dangerAlertSx = {
    bgcolor: withThemeAlpha(theme, palette.background.paper, isDark ? 0.1 : 0.58),
    borderColor: withThemeAlpha(theme, palette.error.main, isDark ? 0.28 : 0.22)
  } as const

  return (
    <>
      <SettingsCardList>
        <ContentSection
          icon={<DeleteSweepOutlinedIcon fontSize="small" />}
          title={t('settings.dangerZone.deleteAllTitle')}
          description={t('settings.dangerZone.deleteAllHint')}
          accent="error"
        >
          <Alert
            severity="error"
            variant="outlined"
            icon={<ErrorOutlineOutlinedIcon />}
            sx={dangerAlertSx}
          >
            {t('settings.dangerZone.warning')}
          </Alert>

          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteSweepOutlinedIcon />}
            onClick={() => setConfirmKind('deleteAll')}
            disabled={disabled || !hasProxyData}
            fullWidth
            sx={{ mt: 1.5 }}
          >
            {t('settings.dangerZone.deleteAllButton')}
          </Button>
        </ContentSection>

        <ContentSection
          icon={<RestartAltOutlinedIcon fontSize="small" />}
          title={t('settings.dangerZone.resetSettingsTitle')}
          description={t('settings.dangerZone.resetSettingsHint')}
          accent="warning"
        >
          <Button
            variant="outlined"
            color="warning"
            startIcon={<RestartAltOutlinedIcon />}
            onClick={() => setConfirmKind('resetSettings')}
            disabled={disabled}
            fullWidth
          >
            {t('settings.dangerZone.resetSettingsButton')}
          </Button>
        </ContentSection>
      </SettingsCardList>

      <Dialog
        open={confirmKind !== null}
        onClose={handleCloseConfirm}
        fullWidth
        maxWidth="xs"
        slotProps={{
          backdrop: {
            sx: { backdropFilter: 'blur(4px)' }
          }
        }}
      >
        <DialogTitle>{confirmTitle}</DialogTitle>
        <DialogContent>
          <DialogContentText>{confirmMessage}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
          <Button onClick={handleCloseConfirm} disabled={isProcessing}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            color={confirmKind === 'deleteAll' ? 'error' : 'warning'}
            onClick={() => void handleConfirm()}
            disabled={isProcessing}
          >
            {confirmKind === 'deleteAll'
              ? t('common.delete')
              : t('settings.dangerZone.resetSettingsButton')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default SettingsDangerSection
