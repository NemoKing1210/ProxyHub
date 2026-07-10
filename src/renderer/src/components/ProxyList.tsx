import AddIcon from '@mui/icons-material/Add'
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined'
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay'
import { Box, Button, Chip, CircularProgress, Paper, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Proxy } from '../../../shared/types/proxy'
import { useProxyStore } from '../store/proxyStore'
import { elevationShadow, staggerDelay, surfaceContainer, surfaceTint } from '../theme'
import type { ProxyFormValues } from '../validation/proxySchema'
import ProxyCard from './ProxyCard'
import ProxyFormDialog from './ProxyFormDialog'

function toProxyInput(values: ProxyFormValues): {
  protocol: ProxyFormValues['protocol']
  host: string
  port: number
  label?: string
  username?: string
  password?: string
} {
  return {
    protocol: values.protocol,
    host: values.host.trim(),
    port: values.port,
    label: values.label?.trim() || undefined,
    username: values.username?.trim() || undefined,
    password: values.password || undefined
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
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mt: 0.5 }}>
            <Chip
              label={t('proxyList.stats', {
                total: proxies.length,
                alive: aliveCount,
                dead: deadCount
              })}
              size="small"
              sx={{
                bgcolor: surfaceContainer(theme, 'default'),
                fontWeight: 600,
                border: 'none'
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
          {proxies.map((proxy, index) => (
            <Box
              key={proxy.id}
              sx={{
                animation: 'cardEnter 0.4s cubic-bezier(0.05, 0.7, 0.1, 1) both',
                animationDelay: staggerDelay(index),
                '@media (prefers-reduced-motion: reduce)': {
                  animation: 'none'
                },
                '@keyframes cardEnter': {
                  from: {
                    opacity: 0,
                    transform: 'translateY(16px) scale(0.98)'
                  },
                  to: {
                    opacity: 1,
                    transform: 'translateY(0) scale(1)'
                  }
                }
              }}
            >
              <ProxyCard
                proxy={proxy}
                isChecking={checkingIds.has(proxy.id)}
                isCheckingAll={isCheckingAll}
                onCheck={() => void checkProxy(proxy.id)}
                onEdit={() => openEditDialog(proxy)}
                onDelete={() => void removeProxy(proxy.id)}
              />
            </Box>
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
