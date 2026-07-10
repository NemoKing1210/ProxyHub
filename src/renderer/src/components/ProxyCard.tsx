import CheckIcon from '@mui/icons-material/Check'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import LinkIcon from '@mui/icons-material/Link'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import RouterOutlinedIcon from '@mui/icons-material/RouterOutlined'
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  Typography
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Proxy } from '../../../shared/types/proxy'
import { buildProxyUrl, formatProxyAddress } from '../../../shared/utils/proxy-format'
import ContentSection from './ContentSection'
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
  secret?: boolean
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
  const [linkCopied, setLinkCopied] = useState(false)

  const proxyUrl = buildProxyUrl(proxy)
  const address = formatProxyAddress(proxy)

  const connectionFields = useMemo(() => {
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
        monospace: true,
        secret: true
      })
    }

    return fields
  }, [proxy, t])

  const resultFields = useMemo(() => {
    const fields: ImportantField[] = []

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

  const renderFields = (fields: ImportantField[]): React.JSX.Element => (
    <Stack spacing={1}>
      {fields.map((field) => (
        <CopyableField
          key={field.label}
          label={field.label}
          value={field.value}
          displayValue={field.displayValue}
          monospace={field.monospace}
          secret={field.secret}
        />
      ))}
    </Stack>
  )

  return (
    <Box
      sx={{
        borderRadius: 2.5,
        bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.06 : 0.04),
        transition: 'box-shadow 0.2s ease, background-color 0.2s ease',
        '&:hover': {
          bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.09 : 0.06),
          boxShadow:
            theme.palette.mode === 'dark'
              ? `0 10px 24px ${alpha(theme.palette.common.black, 0.35)}`
              : `0 10px 24px ${alpha(theme.palette.primary.main, 0.1)}`
        }
      }}
    >
      <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start', mb: 2.5 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 2,
              flexShrink: 0,
              bgcolor: alpha(theme.palette.primary.main, 0.14),
              color: 'primary.main'
            }}
          >
            <RouterOutlinedIcon fontSize="small" />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}
            >
              <Typography
                variant="h6"
                sx={{ fontSize: '1.05rem', fontWeight: 600, lineHeight: 1.3 }}
                noWrap
              >
                {proxy.label || proxy.host}
              </Typography>
              <ProxyStatusChip status={proxy.status} />
            </Stack>

            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
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
              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                {address}
              </Typography>
            </Stack>
          </Box>
        </Stack>

        <Stack spacing={2}>
          <ContentSection
            nested
            collapsible
            defaultExpanded={false}
            icon={<DnsOutlinedIcon fontSize="small" />}
            title={t('proxyList.sections.connection')}
            description={t('proxyList.sections.connectionDescription')}
          >
            {renderFields(connectionFields)}
          </ContentSection>

          {resultFields.length > 0 && (
            <ContentSection
              nested
              icon={<SpeedOutlinedIcon fontSize="small" />}
              title={t('proxyList.sections.results')}
              description={t('proxyList.sections.resultsDescription')}
            >
              {renderFields(resultFields)}
            </ContentSection>
          )}
        </Stack>

        {proxy.error && (
          <Box sx={{ mt: 2 }}>
            <ProxyErrorPopover error={proxy.error} errorDetails={proxy.errorDetails} />
          </Box>
        )}
      </Box>

      <Box
        sx={{
          px: { xs: 2.5, sm: 3 },
          pb: { xs: 2.5, sm: 3 },
          pt: 0,
          display: 'flex',
          gap: 1,
          flexWrap: 'wrap',
          justifyContent: 'flex-end'
        }}
      >
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
      </Box>
    </Box>
  )
}

export default ProxyCard
