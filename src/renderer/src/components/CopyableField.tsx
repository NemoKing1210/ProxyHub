import CheckIcon from '@mui/icons-material/Check'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface CopyableFieldProps {
  label: string
  value?: string
  displayValue?: string
  monospace?: boolean
  compact?: boolean
}

function CopyableField({
  label,
  value,
  displayValue,
  monospace = false,
  compact = false
}: CopyableFieldProps): React.JSX.Element | null {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const hasValue = Boolean(value)

  if (!hasValue) return null

  const shownValue = displayValue ?? value ?? t('common.none')

  const handleCopy = async (): Promise<void> => {
    if (!value) return

    await navigator.clipboard.writeText(value)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  if (compact) {
    return (
      <Stack
        direction="row"
        spacing={0.5}
        sx={{
          alignItems: 'center',
          px: 1.25,
          py: 0.5,
          borderRadius: 1.5,
          bgcolor: 'action.hover',
          maxWidth: '100%'
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
          {label}:
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            wordBreak: 'break-all',
            ...(monospace ? { fontFamily: 'monospace' } : {})
          }}
        >
          {shownValue}
        </Typography>
        <Tooltip title={copied ? t('common.copied') : t('common.copy')}>
          <IconButton
            size="small"
            onClick={() => void handleCopy()}
            sx={{ flexShrink: 0, ml: 0.25 }}
            aria-label={t('common.copy')}
          >
            {copied ? (
              <CheckIcon sx={{ fontSize: 15 }} color="success" />
            ) : (
              <ContentCopyIcon sx={{ fontSize: 15 }} />
            )}
          </IconButton>
        </Tooltip>
      </Stack>
    )
  }

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minHeight: 28 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ width: 108, flexShrink: 0, lineHeight: 1.4 }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          fontWeight: 500,
          wordBreak: 'break-all',
          ...(monospace ? { fontFamily: 'monospace' } : {})
        }}
      >
        {shownValue}
      </Typography>
      <Tooltip title={copied ? t('common.copied') : t('common.copy')}>
        <span>
          <IconButton
            size="small"
            onClick={() => void handleCopy()}
            disabled={!hasValue}
            sx={{ flexShrink: 0 }}
            aria-label={t('common.copy')}
          >
            {copied ? (
              <CheckIcon sx={{ fontSize: 16 }} color="success" />
            ) : (
              <ContentCopyIcon sx={{ fontSize: 16 }} />
            )}
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  )
}

export default CopyableField
