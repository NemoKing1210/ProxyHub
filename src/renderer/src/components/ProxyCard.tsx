import CheckIcon from '@mui/icons-material/Check'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import LinkIcon from '@mui/icons-material/Link'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Proxy, ProxyStatus } from '../../../shared/types/proxy'
import { buildProxyUrl } from '../../../shared/utils/proxy-format'
import CopyableField from './CopyableField'
import ProxyErrorPopover from './ProxyErrorPopover'
import ProxyStatusChip from './ProxyStatusChip'

interface ProxyCardProps {
  proxy: Proxy
  isChecking: boolean
  isCheckingAll: boolean
  onCheck: () => void
  onEdit: () => void
  onDelete: () => void
}

interface ImportantField {
  label: string
  value: string
  displayValue?: string
  monospace?: boolean
}

const statusAccent: Record<ProxyStatus, string> = {
  unknown: 'grey.600',
  checking: 'info.main',
  alive: 'success.main',
  dead: 'error.main'
}

function ProxyCard({
  proxy,
  isChecking,
  isCheckingAll,
  onCheck,
  onEdit,
  onDelete
}: ProxyCardProps): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const accent = statusAccent[proxy.status]
  const [linkCopied, setLinkCopied] = useState(false)

  const proxyUrl = buildProxyUrl(proxy)

  const importantFields = useMemo(() => {
    const fields: ImportantField[] = [
      {
        label: t('proxyForm.host'),
        value: proxy.host,
        monospace: true
      },
      {
        label: t('proxyForm.port'),
        value: String(proxy.port),
        monospace: true
      }
    ]

    if (proxy.username) {
      fields.push({
        label: t('proxyList.columns.username'),
        value: proxy.username,
        monospace: true
      })
    }

    if (proxy.password) {
      fields.push({
        label: t('proxyList.columns.password'),
        value: proxy.password,
        displayValue: '••••••••',
        monospace: true
      })
    }

    if (proxy.latencyMs !== undefined) {
      fields.push({
        label: t('proxyList.columns.latency'),
        value: t('proxyList.latencyMs', { value: proxy.latencyMs })
      })
    }

    if (proxy.externalIp) {
      fields.push({
        label: t('proxyList.columns.externalIp'),
        value: proxy.externalIp,
        monospace: true
      })
    }

    if (proxy.checkTarget) {
      fields.push({
        label: t('proxyList.columns.checkTarget'),
        value: proxy.checkTarget,
        monospace: true
      })
    }

    return fields
  }, [proxy, t])

  const handleCopyLink = async (): Promise<void> => {
    await navigator.clipboard.writeText(proxyUrl)
    setLinkCopied(true)
    window.setTimeout(() => setLinkCopied(false), 1500)
  }

  return (
    <Card
      elevation={0}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        border: 1,
        borderColor: 'divider',
        borderLeft: 4,
        borderLeftColor: accent,
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
        '&:hover': {
          boxShadow:
            theme.palette.mode === 'dark'
              ? `0 12px 28px ${alpha(theme.palette.common.black, 0.45)}`
              : `0 12px 28px ${alpha(theme.palette.primary.main, 0.12)}`
        }
      }}
    >
      <CardContent
        sx={{
          flex: 1,
          minWidth: 0,
          py: 2,
          '&:last-child': { pb: proxy.error ? 1.5 : 2 }
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={{ xs: 1.5, md: 2 }}
          sx={{ alignItems: { md: 'center' } }}
        >
          <Box sx={{ minWidth: { md: 200 }, flexShrink: 0 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.75 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }} noWrap>
                {proxy.label || proxy.host}
              </Typography>
              <ProxyStatusChip status={proxy.status} />
            </Stack>
            <Chip
              label={proxy.protocol.toUpperCase()}
              size="small"
              sx={{
                fontWeight: 700,
                letterSpacing: 0.4,
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                color: 'primary.main'
              }}
            />
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              flex: 1,
              minWidth: 0
            }}
          >
            {importantFields.map((field) => (
              <CopyableField
                key={field.label}
                label={field.label}
                value={field.value}
                displayValue={field.displayValue}
                monospace={field.monospace}
                compact
              />
            ))}
          </Box>
        </Stack>

        {proxy.error && (
          <Box sx={{ mt: 1.5 }}>
            <ProxyErrorPopover error={proxy.error} errorDetails={proxy.errorDetails} />
          </Box>
        )}
      </CardContent>

      <Divider />

      <CardActions sx={{ px: 1.5, py: 1.25, gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <Button
          size="small"
          variant="outlined"
          color="primary"
          startIcon={linkCopied ? <CheckIcon /> : <LinkIcon />}
          onClick={() => void handleCopyLink()}
        >
          {linkCopied ? t('common.copied') : t('proxyList.actions.copyLink')}
        </Button>
        <Button
          size="small"
          variant="contained"
          color="primary"
          startIcon={
            isChecking ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />
          }
          onClick={onCheck}
          disabled={isChecking || isCheckingAll}
        >
          {t('proxyList.actions.check')}
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<EditOutlinedIcon />}
          onClick={onEdit}
          disabled={isCheckingAll}
        >
          {t('proxyList.actions.edit')}
        </Button>
        <Button
          size="small"
          variant="outlined"
          color="error"
          startIcon={<DeleteOutlinedIcon />}
          onClick={onDelete}
          disabled={isCheckingAll}
        >
          {t('proxyList.actions.delete')}
        </Button>
      </CardActions>
    </Card>
  )
}

export default ProxyCard
