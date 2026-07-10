import AddIcon from '@mui/icons-material/Add'
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay'
import {
  Box,
  Button,
  CircularProgress,
  LinearProgress,
  Paper,
  Stack,
  Typography
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Proxy } from '../../../shared/types/proxy'
import { useProxyStore } from '../store/proxyStore'
import type { ProxyFormValues } from '../validation/proxySchema'
import ProxyCard from './ProxyCard'
import ProxyFormDialog from './ProxyFormDialog'

function toProxyInput(values: ProxyFormValues) {
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
          <Typography variant="body2" color="text.secondary">
            {t('proxyList.stats', { total: proxies.length, alive: aliveCount, dead: deadCount })}
          </Typography>
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

      {isCheckingAll && <LinearProgress sx={{ mb: 2 }} />}

      {isLoading ? (
        <Paper
          elevation={0}
          sx={{
            py: 8,
            border: 1,
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <CircularProgress size={32} />
        </Paper>
      ) : proxies.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            py: 8,
            px: 3,
            border: 1,
            borderColor: 'divider',
            textAlign: 'center'
          }}
        >
          <Typography color="text.secondary">{t('proxyList.empty')}</Typography>
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
