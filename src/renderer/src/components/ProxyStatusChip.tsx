import { Chip } from '@mui/material'
import { useTranslation } from 'react-i18next'
import type { ProxyStatus } from '../../../shared/types/proxy'

interface ProxyStatusChipProps {
  status: ProxyStatus
}

function ProxyStatusChip({ status }: ProxyStatusChipProps): React.JSX.Element {
  const { t } = useTranslation()

  const statusConfig: Record<
    ProxyStatus,
    { label: string; color: 'default' | 'info' | 'success' | 'error' }
  > = {
    unknown: { label: t('proxyStatus.unknown'), color: 'default' },
    checking: { label: t('proxyStatus.checking'), color: 'info' },
    alive: { label: t('proxyStatus.alive'), color: 'success' },
    dead: { label: t('proxyStatus.dead'), color: 'error' }
  }

  const config = statusConfig[status]

  return <Chip label={config.label} color={config.color} size="small" variant="outlined" />
}

export default ProxyStatusChip
