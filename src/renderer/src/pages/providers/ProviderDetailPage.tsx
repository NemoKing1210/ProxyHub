import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Typography
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import type { ProviderFetchParams } from '@shared/types/provider'
import ProviderProxyRow from '../../components/providers/ProviderProxyRow'
import { getListCardPosition, getListCardRadius } from '../../lib/card-list'
import { useProviderStore } from '../../store/providerStore'
import { useToastStore } from '../../store/toastStore'

function ProviderDetailPage(): React.JSX.Element {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { providerId } = useParams<{ providerId: string }>()
  const showToast = useToastStore((s) => s.show)

  const providers = useProviderStore((s) => s.providers)
  const proxiesByProvider = useProviderStore((s) => s.proxiesByProvider)
  const isFetching = useProviderStore((s) =>
    providerId ? (s.isFetching[providerId] ?? false) : false
  )
  const fetchError = useProviderStore((s) =>
    providerId ? (s.fetchError[providerId] ?? null) : null
  )
  const checkingIds = useProviderStore((s) => s.checkingIds)
  const isCheckingAll = useProviderStore((s) => s.isCheckingAll)
  const fetchProviders = useProviderStore((s) => s.fetchProviders)
  const fetchProxies = useProviderStore((s) => s.fetchProxies)
  const checkProviderProxy = useProviderStore((s) => s.checkProviderProxy)
  const checkAllProviderProxies = useProviderStore((s) => s.checkAllProviderProxies)
  const cancelCheckAll = useProviderStore((s) => s.cancelCheckAll)
  const addToMyProxies = useProviderStore((s) => s.addToMyProxies)

  const [protocol, setProtocol] = useState<ProviderFetchParams['protocol']>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const provider = useMemo(
    () => providers.find((p) => p.id === providerId),
    [providers, providerId]
  )
  const proxies = useMemo(
    () => (providerId ? (proxiesByProvider[providerId] ?? []) : []),
    [proxiesByProvider, providerId]
  )

  useEffect(() => {
    if (providers.length === 0) {
      void fetchProviders()
    }
  }, [providers.length, fetchProviders])

  useEffect(() => {
    if (!providerId) return
    if (providers.length === 0) return
    if (!provider) {
      showToast({
        severity: 'error',
        title: t('providers.errors.unknownProvider', { defaultValue: 'Unknown provider' }),
        message: t('providers.errors.unknownProviderMessage', {
          defaultValue: `Provider ${providerId} not found`
        })
      })
      navigate('/providers', { replace: true })
      return
    }

    if (proxies.length === 0 && !isFetching && !fetchError) {
      void fetchProxies(providerId, { protocol }).catch(() => {
        showToast({
          severity: 'error',
          title: t('providers.errors.fetchFailed', { defaultValue: 'Failed to fetch proxies' }),
          message:
            fetchError ??
            t('providers.errors.fetchFailedMessage', { defaultValue: 'Network error' })
        })
      })
    }
  }, [
    providerId,
    provider,
    providers.length,
    proxies.length,
    isFetching,
    fetchError,
    fetchProxies,
    protocol,
    navigate,
    showToast,
    t
  ])

  const handleRefresh = async (): Promise<void> => {
    if (!providerId) return
    try {
      await fetchProxies(providerId, { protocol })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      showToast({
        severity: 'error',
        title: t('providers.errors.fetchFailed', { defaultValue: 'Failed to fetch proxies' }),
        message
      })
    }
  }

  const handleCheckAll = async (): Promise<void> => {
    if (!providerId) return
    const ids = selected.size > 0 ? Array.from(selected) : undefined
    await checkAllProviderProxies(providerId, ids)
  }

  const handleAddSelected = async (): Promise<void> => {
    if (!providerId) return
    const ids = Array.from(selected)
    if (ids.length === 0) {
      showToast({
        severity: 'warning',
        title: t('providers.detail.noSelection', { defaultValue: 'No selection' }),
        message: t('providers.detail.noSelectionMessage', { defaultValue: 'Select proxies to add' })
      })
      return
    }
    const added = await addToMyProxies(providerId, ids)
    showToast({
      severity: added > 0 ? 'success' : 'warning',
      title: t('providers.detail.addResult', { defaultValue: 'Added to my proxies' }),
      message: t('providers.detail.addedCount', { defaultValue: `${added} added`, count: added })
    })
    if (added > 0) setSelected(new Set())
  }

  const handleAddSingle = async (proxyId: string): Promise<void> => {
    if (!providerId) return
    const added = await addToMyProxies(providerId, [proxyId])
    showToast({
      severity: added > 0 ? 'success' : 'warning',
      title: t('providers.detail.addResult', { defaultValue: 'Added to my proxies' }),
      message:
        added > 0
          ? t('providers.detail.addedSingle', { defaultValue: 'Proxy added' })
          : t('providers.detail.alreadyExists', { defaultValue: 'Already exists' })
    })
  }

  const allSelected = proxies.length > 0 && selected.size === proxies.length
  const indeterminate = selected.size > 0 && selected.size < proxies.length

  const toggleSelectAll = (): void => {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(proxies.map((p) => p.id)))
  }

  const toggleSelect = (id: string): void => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (!providerId) return <Box />

  if (providers.length === 0 && isFetching) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!provider) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography color="text.secondary">
          {t('providers.errors.unknownProvider', { defaultValue: 'Unknown provider' })}
        </Typography>
      </Box>
    )
  }

  const progressValue = (() => {
    if (!isCheckingAll || proxies.length === 0) return null
    const total = proxies.length
    const checked = proxies.filter((p) => p.checkedAt).length
    return { completed: checked, total }
  })()

  return (
    <Box sx={{ width: '100%' }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/providers')} sx={{ mb: 1.5 }}>
        {t('common.back', { defaultValue: 'Back' })}
      </Button>

      <Typography variant="h5" gutterBottom>
        {provider.name}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {provider.description}
      </Typography>

      <Stack
        direction="row"
        spacing={1.5}
        sx={{ mb: 2, flexWrap: 'wrap', gap: 1, alignItems: 'center' }}
      >
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>{t('providers.detail.protocol', { defaultValue: 'Protocol' })}</InputLabel>
          <Select
            value={protocol}
            label={t('providers.detail.protocol', { defaultValue: 'Protocol' })}
            onChange={(e) => setProtocol(e.target.value as ProviderFetchParams['protocol'])}
          >
            <MenuItem value="all">all</MenuItem>
            <MenuItem value="http">http</MenuItem>
            <MenuItem value="socks4">socks4</MenuItem>
            <MenuItem value="socks5">socks5</MenuItem>
          </Select>
        </FormControl>

        <Button variant="contained" onClick={handleRefresh} disabled={isFetching}>
          {t('providers.detail.fetch', { defaultValue: 'Refresh' })}
        </Button>

        <Button variant="text" onClick={() => void window.api.openExternal(provider.url)}>
          {t('providers.detail.openWebsite', { defaultValue: 'Open website' })}
        </Button>
      </Stack>

      <Stack
        direction="row"
        spacing={1}
        sx={{ mb: 1.5, flexWrap: 'wrap', gap: 1, alignItems: 'center' }}
      >
        <Button
          variant="contained"
          onClick={handleCheckAll}
          disabled={isCheckingAll || proxies.length === 0}
        >
          {t('providers.detail.checkAll', { defaultValue: 'Check all' })}
        </Button>
        {isCheckingAll && (
          <Button variant="outlined" color="error" onClick={cancelCheckAll}>
            {t('providers.detail.stop', { defaultValue: 'Stop' })}
          </Button>
        )}
        <Button variant="outlined" onClick={handleAddSelected} disabled={selected.size === 0}>
          {t('providers.detail.addSelected', { defaultValue: 'Add selected' })}{' '}
          {selected.size > 0 ? `(${selected.size})` : ''}
        </Button>
        <Button variant="text" onClick={toggleSelectAll} disabled={proxies.length === 0}>
          {allSelected
            ? t('providers.detail.deselectAll', { defaultValue: 'Deselect all' })
            : t('providers.detail.selectAll', { defaultValue: 'Select all' })}
        </Button>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
          <Checkbox
            checked={allSelected}
            indeterminate={indeterminate}
            onChange={toggleSelectAll}
            size="small"
          />
          <Typography variant="caption" color="text.secondary">
            {selected.size}/{proxies.length}
          </Typography>
        </Box>
      </Stack>

      {(isCheckingAll || isFetching) && (
        <Box sx={{ mb: 1.5 }}>
          <LinearProgress />
          {progressValue && (
            <Typography variant="caption" color="text.secondary">
              {progressValue.completed}/{progressValue.total}
            </Typography>
          )}
        </Box>
      )}

      {fetchError && (
        <Typography variant="body2" color="error" sx={{ mb: 1.5 }}>
          {fetchError}
        </Typography>
      )}

      {isFetching && proxies.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      ) : (
        <Stack spacing={0.75}>
          {proxies.map((proxy, index) => (
            <ProviderProxyRow
              key={proxy.id}
              proxy={proxy}
              selected={selected.has(proxy.id)}
              isChecking={checkingIds.has(proxy.id) || isCheckingAll}
              listRadius={getListCardRadius(getListCardPosition(index, proxies.length))}
              onToggleSelect={() => toggleSelect(proxy.id)}
              onCheck={() => void checkProviderProxy(providerId, proxy.id)}
              onAdd={() => void handleAddSingle(proxy.id)}
            />
          ))}
          {proxies.length === 0 && !isFetching && (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
              {t('providers.detail.empty', { defaultValue: 'No proxies fetched. Click Refresh.' })}
            </Typography>
          )}
        </Stack>
      )}
    </Box>
  )
}

export default ProviderDetailPage
