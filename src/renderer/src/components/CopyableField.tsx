import CheckIcon from '@mui/icons-material/Check'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import { Box, IconButton, Tooltip, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getPalette, MD3_DURATION, MD3_EASING, surfaceContainer, withThemeAlpha } from '../theme'

interface CopyableFieldProps {
  label: string
  value?: string
  displayValue?: string
  monospace?: boolean
  secret?: boolean
}

function CopyableField({
  label,
  value,
  displayValue,
  monospace = false,
  secret = false
}: CopyableFieldProps): React.JSX.Element | null {
  const { t } = useTranslation()
  const theme = useTheme()
  const palette = getPalette(theme)
  const [copied, setCopied] = useState(false)
  const [visible, setVisible] = useState(false)
  const hasValue = Boolean(value)

  if (!hasValue) return null

  const shownValue = secret && !visible ? '••••••••' : (displayValue ?? value ?? t('common.none'))

  const handleCopy = async (): Promise<void> => {
    if (!value) return

    await navigator.clipboard.writeText(value)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  const handleKeyDown = (event: React.KeyboardEvent): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      void handleCopy()
    }
  }

  const toggleVisibility = (event: React.MouseEvent): void => {
    event.stopPropagation()
    setVisible((current) => !current)
  }

  return (
    <Tooltip title={copied ? t('common.copied') : t('common.copy')} placement="top">
      <Box
        role="button"
        tabIndex={0}
        onClick={() => void handleCopy()}
        onKeyDown={handleKeyDown}
        aria-label={`${t('common.copy')}: ${label}`}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          width: '100%',
          px: 1.75,
          py: 1.25,
          borderRadius: '16px',
          bgcolor: copied
            ? withThemeAlpha(theme, palette.success.main, 0.14)
            : surfaceContainer(theme, 'low'),
          cursor: 'pointer',
          transition: `background-color ${MD3_DURATION.short4}ms ${MD3_EASING.standard}, box-shadow ${MD3_DURATION.short4}ms ${MD3_EASING.standard}, transform ${MD3_DURATION.short3}ms ${MD3_EASING.standard}`,
          '&:hover': {
            bgcolor: copied
              ? withThemeAlpha(theme, palette.success.main, 0.18)
              : surfaceContainer(theme, 'default'),
            boxShadow: `inset 3px 0 0 ${copied ? palette.success.main : palette.primary.main}`,
            transform: 'translateX(2px)',
            '& .copyable-field-icon': {
              color: copied ? 'success.main' : 'primary.main',
              opacity: 1
            }
          },
          '&:focus-visible': {
            outline: `2px solid ${palette.primary.main}`,
            outlineOffset: 2
          },
          '&:active': {
            transform: 'scale(0.995)'
          }
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: 'block',
              mb: 0.35,
              fontWeight: 700,
              letterSpacing: 0.6,
              textTransform: 'uppercase',
              fontSize: '0.65rem',
              lineHeight: 1.2
            }}
          >
            {label}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              lineHeight: 1.45,
              wordBreak: 'break-all',
              color: copied ? 'success.main' : 'text.primary',
              transition: `color ${MD3_DURATION.short4}ms ${MD3_EASING.standard}`,
              ...(monospace ? { fontFamily: 'monospace', fontSize: '0.9rem' } : {})
            }}
          >
            {shownValue}
          </Typography>
        </Box>

        {secret && (
          <Tooltip title={visible ? t('common.hidePassword') : t('common.showPassword')}>
            <IconButton
              size="small"
              onClick={toggleVisibility}
              sx={{
                flexShrink: 0,
                color: 'text.secondary'
              }}
              aria-label={visible ? t('common.hidePassword') : t('common.showPassword')}
            >
              {visible ? (
                <VisibilityOffIcon fontSize="small" />
              ) : (
                <VisibilityIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        )}

        <Box
          className="copyable-field-icon"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            width: 34,
            height: 34,
            borderRadius: '12px',
            color: copied ? 'success.main' : 'text.disabled',
            bgcolor: copied
              ? withThemeAlpha(theme, palette.success.main, 0.16)
              : surfaceContainer(theme, 'default'),
            opacity: 0.85,
            transition: `color ${MD3_DURATION.short4}ms ${MD3_EASING.standard}, background-color ${MD3_DURATION.short4}ms ${MD3_EASING.standard}, opacity ${MD3_DURATION.short4}ms ${MD3_EASING.standard}`
          }}
        >
          {copied ? <CheckIcon sx={{ fontSize: 18 }} /> : <ContentCopyIcon sx={{ fontSize: 17 }} />}
        </Box>
      </Box>
    </Tooltip>
  )
}

export default CopyableField
