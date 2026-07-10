import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Stack,
  Switch,
  TextField,
  Typography
} from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BACKUP_MIN_PASSWORD_LENGTH } from '../../../shared/constants/backup-crypto'

interface BackupPasswordFieldsProps {
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
  password: string
  onPasswordChange: (value: string) => void
  confirmPassword: string
  onConfirmPasswordChange: (value: string) => void
  disabled?: boolean
  showToggle?: boolean
}

export function validateBackupExportPassword(
  protectWithPassword: boolean,
  password: string,
  confirmPassword: string
): 'too_short' | 'mismatch' | null {
  if (!protectWithPassword) {
    return null
  }

  if (password.length < BACKUP_MIN_PASSWORD_LENGTH) {
    return 'too_short'
  }

  if (password !== confirmPassword) {
    return 'mismatch'
  }

  return null
}

function BackupPasswordFields({
  enabled,
  onEnabledChange,
  password,
  onPasswordChange,
  confirmPassword,
  onConfirmPasswordChange,
  disabled = false,
  showToggle = true
}: BackupPasswordFieldsProps): React.JSX.Element {
  const { t } = useTranslation()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const passwordError =
    enabled && password.length > 0 && password.length < BACKUP_MIN_PASSWORD_LENGTH
      ? t('settings.backup.passwordTooShort', { min: BACKUP_MIN_PASSWORD_LENGTH })
      : undefined

  const confirmPasswordError =
    enabled && confirmPassword.length > 0 && password !== confirmPassword
      ? t('settings.backup.passwordMismatch')
      : undefined

  return (
    <Stack spacing={1.5}>
      {showToggle && (
        <FormControlLabel
          control={
            <Switch
              checked={enabled}
              onChange={(_event, checked) => onEnabledChange(checked)}
              disabled={disabled}
            />
          }
          label={t('settings.backup.protectWithPassword')}
        />
      )}

      {enabled && (
        <>
          <Typography variant="body2" color="text.secondary">
            {t('settings.backup.protectWithPasswordHint')}
          </Typography>

          <TextField
            label={t('settings.backup.exportPassword')}
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            disabled={disabled}
            fullWidth
            autoComplete="new-password"
            error={Boolean(passwordError)}
            helperText={passwordError}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPassword ? t('common.hidePassword') : t('common.showPassword')}
                      onClick={() => setShowPassword((value) => !value)}
                      edge="end"
                      disabled={disabled}
                    >
                      {showPassword ? (
                        <VisibilityOffOutlinedIcon fontSize="small" />
                      ) : (
                        <VisibilityOutlinedIcon fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                )
              }
            }}
          />

          <TextField
            label={t('settings.backup.exportPasswordConfirm')}
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(event) => onConfirmPasswordChange(event.target.value)}
            disabled={disabled}
            fullWidth
            autoComplete="new-password"
            error={Boolean(confirmPasswordError)}
            helperText={confirmPasswordError}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={
                        showConfirmPassword ? t('common.hidePassword') : t('common.showPassword')
                      }
                      onClick={() => setShowConfirmPassword((value) => !value)}
                      edge="end"
                      disabled={disabled}
                    >
                      {showConfirmPassword ? (
                        <VisibilityOffOutlinedIcon fontSize="small" />
                      ) : (
                        <VisibilityOutlinedIcon fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                )
              }
            }}
          />
        </>
      )}
    </Stack>
  )
}

interface BackupUnlockSectionProps {
  password: string
  onPasswordChange: (value: string) => void
  onUnlock: () => Promise<void>
  isUnlocking: boolean
  error?: string
  disabled?: boolean
}

export function BackupUnlockSection({
  password,
  onPasswordChange,
  onUnlock,
  isUnlocking,
  error,
  disabled = false
}: BackupUnlockSectionProps): React.JSX.Element {
  const { t } = useTranslation()
  const [showPassword, setShowPassword] = useState(false)

  return (
    <Box>
      <Alert severity="info" variant="outlined" icon={<LockOutlinedIcon />} sx={{ mb: 2 }}>
        {t('settings.backup.encryptedHint')}
      </Alert>

      <Stack spacing={1.5}>
        <TextField
          label={t('settings.backup.importPassword')}
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          disabled={disabled || isUnlocking}
          fullWidth
          autoComplete="current-password"
          error={Boolean(error)}
          helperText={error}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showPassword ? t('common.hidePassword') : t('common.showPassword')}
                    onClick={() => setShowPassword((value) => !value)}
                    edge="end"
                    disabled={disabled || isUnlocking}
                  >
                    {showPassword ? (
                      <VisibilityOffOutlinedIcon fontSize="small" />
                    ) : (
                      <VisibilityOutlinedIcon fontSize="small" />
                    )}
                  </IconButton>
                </InputAdornment>
              )
            }
          }}
        />

        <Button
          variant="contained"
          onClick={() => void onUnlock()}
          disabled={disabled || isUnlocking || password.length === 0}
          startIcon={isUnlocking ? <CircularProgress size={18} color="inherit" /> : undefined}
        >
          {t('settings.backup.unlockBackup')}
        </Button>
      </Stack>
    </Box>
  )
}

export default BackupPasswordFields
