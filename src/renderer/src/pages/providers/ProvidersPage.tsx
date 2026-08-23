import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { Box, ButtonBase, Chip, CircularProgress, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { getListCardPosition, getListCardRadius } from '../../lib/card-list'
import { useProviderStore } from '../../store/providerStore'
import {
  elevationShadow,
  getPalette,
  surfaceContainer,
  surfaceTint,
  withThemeAlpha
} from '../../theme'

function ProvidersPage(): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const navigate = useNavigate()
  const providers = useProviderStore((s) => s.providers)
  const isLoading = useProviderStore((s) => s.isLoadingProviders)
  const fetchProviders = useProviderStore((s) => s.fetchProviders)
  const palette = getPalette(theme)

  useEffect(() => {
    void fetchProviders()
  }, [fetchProviders])

  if (isLoading && providers.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h5" gutterBottom>
        {t('providers.title')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3.5 }}>
        {t('providers.description')}
      </Typography>

      <Stack spacing={0.75}>
        {providers.map((provider, index) => {
          const radius = getListCardRadius(getListCardPosition(index, providers.length))

          return (
            <ButtonBase
              key={provider.id}
              onClick={() => navigate(`/providers/${provider.id}`)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                borderRadius: radius,
                bgcolor: surfaceContainer(theme, 'high'),
                border: `1px solid ${withThemeAlpha(theme, palette.primary.main, 0.12)}`,
                boxShadow: elevationShadow(theme, 1),
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.15s ease',
                '&:hover': {
                  bgcolor: surfaceContainer(theme, 'highest'),
                  borderColor: withThemeAlpha(theme, palette.primary.main, 0.2)
                }
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: surfaceTint(theme, 'primary', 0.18),
                  fontWeight: 700,
                  fontSize: 18,
                  color: palette.primary.main,
                  flexShrink: 0
                }}
              >
                {provider.name.charAt(0).toUpperCase()}
              </Box>

              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
                    {provider.name}
                  </Typography>
                  <Chip
                    label={provider.kind === 'builtin' ? 'builtin' : 'custom'}
                    size="small"
                    sx={{ height: 20, fontSize: 11, fontWeight: 600 }}
                  />
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {provider.description}
                </Typography>
              </Box>

              <ButtonBase
                component="span"
                onClick={(e) => {
                  e.stopPropagation()
                  void window.api.openExternal(provider.url)
                }}
                sx={{
                  p: 1,
                  borderRadius: '8px',
                  color: 'text.secondary',
                  '&:hover': { bgcolor: withThemeAlpha(theme, palette.primary.main, 0.08) }
                }}
              >
                <OpenInNewIcon sx={{ fontSize: 18 }} />
              </ButtonBase>
            </ButtonBase>
          )
        })}
      </Stack>

      {providers.length === 0 && !isLoading && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {t('providers.empty', { defaultValue: 'No providers available' })}
        </Typography>
      )}
    </Box>
  )
}

export default ProvidersPage
