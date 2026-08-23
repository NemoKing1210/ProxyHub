import { Box, Divider, Popover, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ProxyCheckErrorDetail } from '@shared/types/proxy'
import { elevationShadow, getPalette, withThemeAlpha } from '../../theme'

interface ProxyErrorPopoverProps {
  error: string
  errorDetails?: ProxyCheckErrorDetail[]
}

const CLOSE_DELAY_MS = 250

function ProxyErrorPopover({ error, errorDetails }: ProxyErrorPopoverProps): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const palette = getPalette(theme)
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const details = errorDetails && errorDetails.length > 0 ? errorDetails : null
  const open = Boolean(anchorEl) && Boolean(details)

  const clearCloseTimer = (): void => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }

  const scheduleClose = (): void => {
    clearCloseTimer()
    closeTimer.current = setTimeout(() => setAnchorEl(null), CLOSE_DELAY_MS)
  }

  const handleOpen = (element: HTMLElement): void => {
    if (!details) return

    clearCloseTimer()
    setAnchorEl(element)
  }

  if (!details) {
    return (
      <Typography
        variant="caption"
        color="error"
        sx={{
          display: 'inline-block',
          px: 1.25,
          py: 0.5,
          borderRadius: '8px',
          bgcolor: withThemeAlpha(theme, palette.error.main, 0.14)
        }}
      >
        {error}
      </Typography>
    )
  }

  return (
    <>
      <Box
        component="span"
        onMouseEnter={(event) => handleOpen(event.currentTarget)}
        onMouseLeave={scheduleClose}
        sx={{ display: 'inline-block', cursor: 'help' }}
      >
        <Typography
          variant="caption"
          color="error"
          sx={{
            textDecoration: 'underline dotted',
            px: 1.25,
            py: 0.5,
            borderRadius: '8px',
            bgcolor: withThemeAlpha(theme, palette.error.main, 0.14)
          }}
        >
          {error}
        </Typography>
      </Box>

      <Popover
        open={open}
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        disableRestoreFocus
        disableAutoFocus
        disableEnforceFocus
        disableScrollLock
        sx={{ pointerEvents: 'none' }}
        slotProps={{
          paper: {
            onMouseEnter: clearCloseTimer,
            onMouseLeave: scheduleClose,
            sx: {
              pointerEvents: 'auto',
              p: 2,
              maxWidth: 380,
              mt: 0.5,
              borderRadius: '16px',
              boxShadow: elevationShadow(theme, 3)
            }
          }
        }}
      >
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>
          {t('proxyList.errorDetailsTitle')}
        </Typography>

        <Stack spacing={1.5} divider={<Divider flexItem />}>
          {details.map((detail) => (
            <Box key={`${detail.domain}-${detail.url}`}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {t('proxyList.errorDomain')}:{' '}
                <Box component="span" sx={{ fontFamily: 'monospace', color: 'text.primary' }}>
                  {detail.domain}
                </Box>
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {t('proxyList.errorUrl')}:{' '}
                <Box component="span" sx={{ fontFamily: 'monospace', color: 'text.primary' }}>
                  {detail.url}
                </Box>
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {t('proxyList.errorMessage')}:{' '}
                <Box component="span" sx={{ color: 'error.main' }}>
                  {detail.message}
                </Box>
              </Typography>
              {detail.code && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {t('proxyList.errorCode')}:{' '}
                  <Box component="span" sx={{ fontFamily: 'monospace', color: 'text.primary' }}>
                    {detail.code}
                  </Box>
                </Typography>
              )}
            </Box>
          ))}
        </Stack>
      </Popover>
    </>
  )
}

export default ProxyErrorPopover
