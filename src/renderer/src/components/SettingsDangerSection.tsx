import DeleteSweepOutlinedIcon from '@mui/icons-material/DeleteSweepOutlined'
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Typography
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ContentSection from './ContentSection'
import { outlineVariant, surfaceContainer } from '../theme'

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
      ? t('settings.dangerZone.deleteAllConfirmMessage', { proxies: proxyCount, groups: groupCount })
      : t('settings.dangerZone.resetSettingsConfirmMessage')

  return (
    <>
      <ContentSection
        icon={<WarningAmberOutlinedIcon fontSize="small" />}
        title={t('settings.sections.dangerZone')}
        description={t('settings.sections.dangerZoneDescription')}
        collapsible
        defaultExpanded={false}
      >
        <Stack spacing={2.5}>
          <Alert severity="warning" variant="outlined" icon={<WarningAmberOutlinedIcon />}>
            {t('settings.dangerZone.warning')}
          </Alert>

          <Box
            sx={{
              p: 2,
              borderRadius: 2.5,
              bgcolor: surfaceContainer(theme, 'low'),
              boxShadow: `inset 0 0 0 1px ${outlineVariant(theme)}`
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              {t('settings.dangerZone.deleteAllTitle')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              {t('settings.dangerZone.deleteAllHint')}
            </Typography>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteSweepOutlinedIcon />}
              onClick={() => setConfirmKind('deleteAll')}
              disabled={disabled || !hasProxyData}
              fullWidth
            >
              {t('settings.dangerZone.deleteAllButton')}
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
              {t('settings.dangerZone.resetSettingsTitle')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              {t('settings.dangerZone.resetSettingsHint')}
            </Typography>
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
          </Box>
        </Stack>
      </ContentSection>

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
            {confirmKind === 'deleteAll' ? t('common.delete') : t('settings.dangerZone.resetSettingsButton')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default SettingsDangerSection
