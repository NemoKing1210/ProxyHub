import CloudOutlinedIcon from '@mui/icons-material/CloudOutlined'
import { Box, Fade, Tooltip } from '@mui/material'
import { keyframes } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import { TITLE_BAR_HEIGHT } from '@shared/theme/title-bar'
import { useSyncActivityStore } from '../../store/syncActivityStore'
import { isWindows } from '../../utils/platform'

const syncPulse = keyframes`
  0%, 100% {
    opacity: 0.4;
    transform: scale(1);
  }
  50% {
    opacity: 0.85;
    transform: scale(1.1);
  }
`

function SyncActivityIndicator(): React.JSX.Element | null {
  const { t } = useTranslation()
  const isActive = useSyncActivityStore((state) => state.isActive)

  return (
    <Box
      sx={{
        position: 'fixed',
        top: isWindows() ? TITLE_BAR_HEIGHT + 10 : 14,
        left: 14,
        zIndex: (theme) => theme.zIndex.modal + 1,
        pointerEvents: isActive ? 'auto' : 'none',
        WebkitAppRegion: 'no-drag'
      }}
    >
      <Fade in={isActive} timeout={220}>
        <Tooltip title={t('sync.activity')} placement="right" arrow>
          <Box
            aria-label={t('sync.activity')}
            role="status"
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              color: 'text.secondary',
              animation: `${syncPulse} 1.6s ease-in-out infinite`
            }}
          >
            <CloudOutlinedIcon sx={{ fontSize: 18 }} />
          </Box>
        </Tooltip>
      </Fade>
    </Box>
  )
}

export default SyncActivityIndicator
