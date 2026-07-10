import CheckIcon from '@mui/icons-material/Check'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import { Box, IconButton, Tooltip, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

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
  const [copied, setCopied] = useState(false)
  const [visible, setVisible] = useState(false)
  const hasValue = Boolean(value)

  if (!hasValue) return null

  const shownValue =
    secret && !visible ? '••••••••' : (displayValue ?? value ?? t('common.none'))

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
          borderRadius: 2,
          bgcolor: copied
            ? alpha(theme.palette.success.main, theme.palette.mode === 'dark' ? 0.14 : 0.08)
            : alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.06 : 0.03),
          cursor: 'pointer',
          transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.12 : 0.07),
            boxShadow: `inset 3px 0 0 ${theme.palette.primary.main}`,
            '& .copyable-field-icon': {
              color: 'primary.main',
              opacity: 1
            }
          },
          '&:focus-visible': {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: 2
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
              fontWeight: 600,
              letterSpacing: 0.4,
              textTransform: 'uppercase',
              fontSize: '0.68rem',
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
              transition: 'color 0.2s ease',
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
                color: 'text.secondary',
                '&:hover': {
                  color: 'primary.main',
                  bgcolor: alpha(theme.palette.primary.main, 0.1)
                }
              }}
              aria-label={visible ? t('common.hidePassword') : t('common.showPassword')}
            >
              {visible ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
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
            width: 32,
            height: 32,
            borderRadius: 1.5,
            color: copied ? 'success.main' : 'text.disabled',
            bgcolor: copied
              ? alpha(theme.palette.success.main, 0.12)
              : alpha(theme.palette.action.active, 0.06),
            opacity: 0.75,
            transition: 'color 0.2s ease, background-color 0.2s ease, opacity 0.2s ease'
          }}
        >
          {copied ? (
            <CheckIcon sx={{ fontSize: 18 }} />
          ) : (
            <ContentCopyIcon sx={{ fontSize: 17 }} />
          )}
        </Box>
      </Box>
    </Tooltip>
  )
}

export default CopyableField
