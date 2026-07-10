import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined'
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import { Chip, type ChipProps } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import type { ProxyStatus } from '../../../shared/types/proxy'
import { getPalette, withThemeAlpha } from '../theme'

interface ProxyStatusChipProps {
  status: ProxyStatus
}

const STATUS_ICONS: Record<ProxyStatus, React.ReactElement | undefined> = {
  unknown: <HelpOutlineOutlinedIcon />,
  checking: <HourglassEmptyIcon />,
  alive: <CheckCircleOutlinedIcon />,
  dead: <ErrorOutlineOutlinedIcon />
}

function ProxyStatusChip({ status }: ProxyStatusChipProps): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const palette = getPalette(theme)

  const statusConfig: Record<
    ProxyStatus,
    { label: string; color: ChipProps['color']; bg: string; fg: string }
  > = {
    unknown: {
      label: t('proxyStatus.unknown'),
      color: 'default',
      bg: withThemeAlpha(theme, palette.text.primary, 0.1),
      fg: palette.text.secondary
    },
    checking: {
      label: t('proxyStatus.checking'),
      color: 'info',
      bg: withThemeAlpha(theme, palette.info.main, 0.16),
      fg: palette.info.main
    },
    alive: {
      label: t('proxyStatus.alive'),
      color: 'success',
      bg: withThemeAlpha(theme, palette.success.main, 0.16),
      fg: palette.success.main
    },
    dead: {
      label: t('proxyStatus.dead'),
      color: 'error',
      bg: withThemeAlpha(theme, palette.error.main, 0.16),
      fg: palette.error.main
    }
  }

  const config = statusConfig[status]

  return (
    <Chip
      icon={STATUS_ICONS[status]}
      label={config.label}
      color={config.color}
      size="small"
      sx={{
        fontWeight: 700,
        letterSpacing: 0.2,
        bgcolor: config.bg,
        color: config.fg,
        border: 'none',
        '& .MuiChip-icon': {
          color: 'inherit',
          fontSize: 16,
          ...(status === 'checking'
            ? {
                animation: 'statusPulse 1.4s ease-in-out infinite',
                '@keyframes statusPulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.45 }
                }
              }
            : {})
        }
      }}
    />
  )
}

export default ProxyStatusChip
