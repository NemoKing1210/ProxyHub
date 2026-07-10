import FilterListIcon from '@mui/icons-material/FilterList'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined'
import StarBorderOutlinedIcon from '@mui/icons-material/StarBorderOutlined'
import StarOutlinedIcon from '@mui/icons-material/StarOutlined'
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined'
import {
  Box,
  Button,
  Chip,
  FormControlLabel,
  MenuItem,
  Slider,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { findProxyCountry } from '../../../shared/constants/proxy-countries'
import { PROXY_ANONYMITY_LEVELS, PROXY_PROTOCOLS } from '../../../shared/types/proxy'
import type { Proxy, ProxyProtocol } from '../../../shared/types/proxy'
import {
  DEFAULT_PROXY_LIST_FILTERS,
  MAX_LATENCY_FILTER_DEFAULT_MS,
  MAX_LATENCY_FILTER_MAX_MS,
  MAX_LATENCY_FILTER_MIN_MS,
  MAX_LATENCY_FILTER_STEP_MS,
  type ProxyFavoriteFilter,
  type ProxyListFilters,
  type ProxyStatusFilter,
  countActiveFilters,
  hasActiveFilters
} from '../utils/filter-proxies'
import { surfaceContainer } from '../theme'
import ContentSection from './ContentSection'
import CountryFlag from './CountryFlag'

interface ProxyListFiltersProps {
  proxies: Proxy[]
  filters: ProxyListFilters
  shownCount: number
  onChange: (filters: ProxyListFilters) => void
}

function getCountryOptions(proxies: Proxy[]): string[] {
  const codes = new Set<string>()

  for (const proxy of proxies) {
    if (proxy.countryCode) {
      codes.add(proxy.countryCode)
    }
  }

  return [...codes].sort((left, right) => {
    const leftName = findProxyCountry(left)?.name ?? left
    const rightName = findProxyCountry(right)?.name ?? right
    return leftName.localeCompare(rightName)
  })
}

function getProtocolOptions(proxies: Proxy[]): ProxyProtocol[] {
  const protocols = new Set<ProxyProtocol>()

  for (const proxy of proxies) {
    protocols.add(proxy.protocol)
  }

  return PROXY_PROTOCOLS.filter((protocol) => protocols.has(protocol))
}

function getCityOptions(proxies: Proxy[], countryCode: string): string[] {
  const cities = new Map<string, string>()

  for (const proxy of proxies) {
    if (!proxy.city) continue
    if (countryCode && proxy.countryCode !== countryCode) continue

    const key = proxy.city.toLowerCase()
    if (!cities.has(key)) {
      cities.set(key, proxy.city)
    }
  }

  return [...cities.values()].sort((left, right) => left.localeCompare(right))
}

function ProxyListFilters({
  proxies,
  filters,
  shownCount,
  onChange
}: ProxyListFiltersProps): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()

  const countryOptions = useMemo(() => getCountryOptions(proxies), [proxies])
  const protocolOptions = useMemo(() => getProtocolOptions(proxies), [proxies])
  const cityOptions = useMemo(
    () => getCityOptions(proxies, filters.countryCode),
    [proxies, filters.countryCode]
  )

  const isFiltered = hasActiveFilters(filters)
  const activeFilterCount = countActiveFilters(filters)
  const latencyLimitEnabled = filters.maxLatencyMs !== null
  const latencyValue = filters.maxLatencyMs ?? MAX_LATENCY_FILTER_DEFAULT_MS

  const updateFilters = (patch: Partial<ProxyListFilters>): void => {
    onChange({ ...filters, ...patch })
  }

  const handleCountryChange = (countryCode: string): void => {
    const nextCityOptions = getCityOptions(proxies, countryCode)
    const cityStillValid = !filters.city || nextCityOptions.includes(filters.city)

    updateFilters({
      countryCode,
      city: cityStillValid ? filters.city : ''
    })
  }

  const handleFavoriteChange = (
    _event: React.MouseEvent<HTMLElement>,
    value: ProxyFavoriteFilter | null
  ): void => {
    if (!value) return
    updateFilters({ favorite: value })
  }

  const handleStatusChange = (
    _event: React.MouseEvent<HTMLElement>,
    value: ProxyStatusFilter | null
  ): void => {
    if (!value) return
    updateFilters({ status: value })
  }

  const handleLatencyLimitToggle = (enabled: boolean): void => {
    updateFilters({
      maxLatencyMs: enabled ? latencyValue : null
    })
  }

  const handleClear = (): void => {
    onChange(DEFAULT_PROXY_LIST_FILTERS)
  }

  return (
    <ContentSection
      icon={<FilterListIcon fontSize="small" />}
      title={
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <span>{t('proxyList.filters.title')}</span>
          {activeFilterCount > 0 && (
            <Chip
              label={activeFilterCount}
              size="small"
              color="primary"
              title={t('proxyList.filters.activeCount', { count: activeFilterCount })}
              sx={{
                height: 22,
                minWidth: 22,
                fontWeight: 700,
                '& .MuiChip-label': {
                  px: 0.75,
                  lineHeight: 1
                }
              }}
            />
          )}
        </Stack>
      }
      description={t('proxyList.filters.description')}
      collapsible
      defaultExpanded={false}
      nested
    >
      <Stack spacing={2.5}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            select
            label={t('proxyList.filters.protocol')}
            value={filters.protocol}
            onChange={(event) =>
              updateFilters({
                protocol: event.target.value as ProxyListFilters['protocol']
              })
            }
            fullWidth
            disabled={protocolOptions.length === 0}
          >
            <MenuItem value="">{t('proxyList.filters.all')}</MenuItem>
            {protocolOptions.map((protocol) => (
              <MenuItem key={protocol} value={protocol}>
                {protocol.toUpperCase()}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label={t('proxyList.filters.country')}
            value={filters.countryCode}
            onChange={(event) => handleCountryChange(event.target.value)}
            fullWidth
            disabled={countryOptions.length === 0}
            slotProps={{
              select: {
                renderValue: (selected) => {
                  const code = String(selected)

                  if (!code) {
                    return t('proxyList.filters.all')
                  }

                  const country = findProxyCountry(code)

                  return (
                    <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                      <CountryFlag countryCode={code} />
                      <span>{country ? `${country.name} (${country.code})` : code}</span>
                    </Stack>
                  )
                }
              }
            }}
          >
            <MenuItem value="">{t('proxyList.filters.all')}</MenuItem>
            {countryOptions.map((code) => {
              const country = findProxyCountry(code)

              return (
                <MenuItem key={code} value={code}>
                  <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                    <CountryFlag countryCode={code} />
                    <span>{country ? `${country.name} (${country.code})` : code}</span>
                  </Stack>
                </MenuItem>
              )
            })}
          </TextField>

          <TextField
            select
            label={t('proxyList.filters.city')}
            value={filters.city}
            onChange={(event) => updateFilters({ city: event.target.value })}
            fullWidth
            disabled={cityOptions.length === 0}
          >
            <MenuItem value="">{t('proxyList.filters.all')}</MenuItem>
            {cityOptions.map((city) => (
              <MenuItem key={city} value={city}>
                {city}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label={t('proxyList.filters.anonymity')}
            value={filters.anonymityLevel}
            onChange={(event) =>
              updateFilters({
                anonymityLevel: event.target.value as ProxyListFilters['anonymityLevel']
              })
            }
            fullWidth
          >
            <MenuItem value="">{t('proxyList.filters.all')}</MenuItem>
            {PROXY_ANONYMITY_LEVELS.map((level) => (
              <MenuItem key={level} value={level}>
                {t(`proxyAnonymity.${level}`)}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1.25 }}>
              {t('proxyList.filters.favorite')}
            </Typography>
            <ToggleButtonGroup
              value={filters.favorite}
              exclusive
              onChange={handleFavoriteChange}
              fullWidth
              sx={{
                '& .MuiToggleButton-root': {
                  py: 1.1,
                  gap: 0.5
                }
              }}
            >
              <ToggleButton value="all">{t('proxyList.filters.favoriteAll')}</ToggleButton>
              <ToggleButton value="favorites">
                <StarOutlinedIcon fontSize="small" />
                {t('proxyList.filters.favoriteOnly')}
              </ToggleButton>
              <ToggleButton value="nonFavorites">
                <StarBorderOutlinedIcon fontSize="small" />
                {t('proxyList.filters.favoriteNone')}
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1.25 }}>
              {t('proxyList.filters.status')}
            </Typography>
            <ToggleButtonGroup
              value={filters.status}
              exclusive
              onChange={handleStatusChange}
              fullWidth
              sx={{
                '& .MuiToggleButton-root': {
                  py: 1.1,
                  gap: 0.5
                }
              }}
            >
              <ToggleButton value="all">{t('proxyList.filters.statusAll')}</ToggleButton>
              <ToggleButton value="alive">
                <CheckCircleOutlinedIcon fontSize="small" />
                {t('proxyList.filters.statusAlive')}
              </ToggleButton>
              <ToggleButton value="dead">
                <ErrorOutlineOutlinedIcon fontSize="small" />
                {t('proxyList.filters.statusDead')}
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Box>
            <Stack
              direction="row"
              spacing={1}
              sx={{ mb: 1.25, alignItems: 'center', justifyContent: 'space-between' }}
            >
              <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                <TimerOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="subtitle2">{t('proxyList.filters.maxLatency')}</Typography>
              </Stack>
              {latencyLimitEnabled && (
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 2,
                    bgcolor: surfaceContainer(theme, 'high'),
                    color: 'primary.main'
                  }}
                >
                  {t('proxyList.filters.maxLatencyValue', { value: latencyValue })}
                </Typography>
              )}
            </Stack>

            <FormControlLabel
              control={
                <Switch
                  checked={latencyLimitEnabled}
                  onChange={(event) => handleLatencyLimitToggle(event.target.checked)}
                />
              }
              label={t('proxyList.filters.maxLatencyEnabled')}
              sx={{ mb: latencyLimitEnabled ? 1.5 : 0 }}
            />

            {latencyLimitEnabled && (
              <Slider
                value={latencyValue}
                onChange={(_event, value) =>
                  updateFilters({ maxLatencyMs: Array.isArray(value) ? value[0] : value })
                }
                min={MAX_LATENCY_FILTER_MIN_MS}
                max={MAX_LATENCY_FILTER_MAX_MS}
                step={MAX_LATENCY_FILTER_STEP_MS}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => t('proxyList.filters.maxLatencyValue', { value })}
                sx={{ px: 0.5 }}
              />
            )}
          </Box>
        </Stack>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
        >
          {isFiltered ? (
            <Chip
              size="small"
              label={t('proxyList.filters.shown', { shown: shownCount, total: proxies.length })}
              sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
            />
          ) : (
            <Box />
          )}

          <Button variant="text" onClick={handleClear} disabled={!isFiltered}>
            {t('proxyList.filters.clear')}
          </Button>
        </Stack>
      </Stack>
    </ContentSection>
  )
}

export default ProxyListFilters
