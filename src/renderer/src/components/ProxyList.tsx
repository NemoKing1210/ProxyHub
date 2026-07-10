import AddIcon from '@mui/icons-material/Add'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined'
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined'
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay'
import { Box, Button, Chip, CircularProgress, Paper, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Proxy, ProxyInput } from '../../../shared/types/proxy'
import { DEFAULT_PROXY_COLOR_ID, DEFAULT_PROXY_ICON_ID } from '../../../shared/types/proxy'
import { normalizeCountryCode } from '../../../shared/constants/proxy-countries'
import { normalizeAnonymityLevel } from '../../../shared/utils/proxy-import'
import { normalizeProxyColorId } from '../../../shared/utils/proxy-colors'
import { normalizeProxyIconId } from '../../../shared/utils/proxy-icons'
import { useProxyStore } from '../store/proxyStore'
import { elevationShadow, getPalette, surfaceContainer, surfaceTint, withThemeAlpha } from '../theme'
import type { ProxyFormValues } from '../validation/proxySchema'
import ProxyCard from './ProxyCard'
import ProxyFormDialog from './ProxyFormDialog'

function toProxyInput(values: ProxyFormValues): ProxyInput {
  return {
    protocol: values.protocol,
    host: values.host.trim(),
    port: values.port,
    label: values.label?.trim() || undefined,
    icon: (() => {
      const icon = normalizeProxyIconId(values.icon)
      return icon && icon !== DEFAULT_PROXY_ICON_ID ? icon : undefined
    })(),
    color: (() => {
      const color = normalizeProxyColorId(values.color)
      return color && color !== DEFAULT_PROXY_COLOR_ID ? color : undefined
    })(),
    username: values.username?.trim() || undefined,
    password: values.password || undefined,
    countryCode: normalizeCountryCode(values.countryCode),
    city: values.city?.trim() || undefined,
    anonymityLevel: normalizeAnonymityLevel(values.anonymityLevel)
  }
}

function ProxyList(): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const {
    proxies,
    isLoading,
    isCheckingAll,
    checkingIds,
    loadProxies,
    addProxy,
    updateProxy,
    removeProxy,
    checkProxy,
    checkAll
  } = useProxyStore()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add')
  const [editingProxy, setEditingProxy] = useState<Proxy | undefined>()

  useEffect(() => {
    void loadProxies()
  }, [loadProxies])

  const openAddDialog = (): void => {
    setDialogMode('add')
    setEditingProxy(undefined)
    setDialogOpen(true)
  }

  const openEditDialog = (proxy: Proxy): void => {
    setDialogMode('edit')
    setEditingProxy(proxy)
    setDialogOpen(true)
  }

  const handleSubmit = async (values: ProxyFormValues): Promise<void> => {
    const input = toProxyInput(values)

    if (dialogMode === 'add') {
      await addProxy(input)
      return
    }

    if (editingProxy) {
      await updateProxy(editingProxy.id, input)
    }
  }

  const aliveCount = proxies.filter((proxy) => proxy.status === 'alive').length
  const deadCount = proxies.filter((proxy) => proxy.status === 'dead').length
  const palette = getPalette(theme)

  const statBadgeSx = {
    fontWeight: 700,
    border: 'none',
    '& .MuiChip-icon': {
      fontSize: 16,
      ml: 0.75
    },
    '& .MuiChip-label': {
      px: 1
    }
  } as const

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ mb: 3, alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
      >
        <Box>
          <Typography variant="h5" gutterBottom>
            {t('proxyList.title')}
          </Typography>
          <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', mt: 0.5, gap: 0.75 }}>
            <Chip
              icon={<DnsOutlinedIcon />}
              label={t('proxyList.statsTotal', { count: proxies.length })}
              size="small"
              sx={{
                ...statBadgeSx,
                bgcolor: surfaceContainer(theme, 'default'),
                color: 'text.primary',
                '& .MuiChip-icon': {
                  ...statBadgeSx['& .MuiChip-icon'],
                  color: 'primary.main'
                }
              }}
            />
            <Chip
              icon={<CheckCircleOutlinedIcon />}
              label={t('proxyList.statsAlive', { count: aliveCount })}
              size="small"
              sx={{
                ...statBadgeSx,
                bgcolor: withThemeAlpha(theme, palette.success.main, 0.14),
                color: palette.success.main,
                '& .MuiChip-icon': {
                  ...statBadgeSx['& .MuiChip-icon'],
                  color: palette.success.main
                }
              }}
            />
            <Chip
              icon={<ErrorOutlineOutlinedIcon />}
              label={t('proxyList.statsDead', { count: deadCount })}
              size="small"
              sx={{
                ...statBadgeSx,
                bgcolor: withThemeAlpha(theme, palette.error.main, 0.14),
                color: palette.error.main,
                '& .MuiChip-icon': {
                  ...statBadgeSx['& .MuiChip-icon'],
                  color: palette.error.main
                }
              }}
            />
          </Stack>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={isCheckingAll ? <CircularProgress size={18} /> : <PlaylistPlayIcon />}
            onClick={() => void checkAll()}
            disabled={proxies.length === 0 || isCheckingAll}
          >
            {t('proxyList.checkAll')}
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAddDialog}>
            {t('proxyList.addProxy')}
          </Button>
        </Stack>
      </Stack>

      {isLoading ? (
        <Paper
          sx={{
            py: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            borderRadius: 3,
            boxShadow: elevationShadow(theme, 1)
          }}
        >
          <CircularProgress size={36} thickness={4} />
          <Typography variant="body2" color="text.secondary">
            {t('proxyList.title')}
          </Typography>
        </Paper>
      ) : proxies.length === 0 ? (
        <Paper
          sx={{
            py: 10,
            px: 3,
            textAlign: 'center',
            borderRadius: 3,
            boxShadow: elevationShadow(theme, 1),
            bgcolor: surfaceContainer(theme, 'low')
          }}
        >
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 64,
              height: 64,
              borderRadius: 4,
              mb: 2,
              bgcolor: surfaceTint(theme),
              color: 'primary.main'
            }}
          >
            <DnsOutlinedIcon sx={{ fontSize: 32 }} />
          </Box>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
            {t('proxyList.empty')}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openAddDialog}
            sx={{ mt: 1 }}
          >
            {t('proxyList.addProxy')}
          </Button>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {proxies.map((proxy) => (
            <ProxyCard
              key={proxy.id}
              proxy={proxy}
              isChecking={checkingIds.has(proxy.id)}
              isCheckingAll={isCheckingAll}
              onCheck={() => void checkProxy(proxy.id)}
              onEdit={() => openEditDialog(proxy)}
              onDelete={() => void removeProxy(proxy.id)}
            />
          ))}
        </Stack>
      )}

      <ProxyFormDialog
        open={dialogOpen}
        mode={dialogMode}
        initialProxy={editingProxy}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />
    </Box>
  )
}

export default ProxyList
