import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded'
import { Box, ButtonBase, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useSettingsSections } from './sectionsRegistry'
import { getListCardPosition, getListCardRadius } from '../../lib/card-list'
import { surfaceContainer, withThemeAlpha } from '../../theme'

/**
 * Корневая подстраница настроек: сканируемый список категорий.
 * Каждая категория ведёт на свою страницу /settings/:section.
 */
function SettingsOverviewPage(): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const navigate = useNavigate()
  const sections = useSettingsSections()

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h5" gutterBottom>
        {t('settings.title')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3.5 }}>
        {t('settings.description')}
      </Typography>

      <Stack spacing={0.75}>
        {sections.map((item, index) => (
          <ButtonBase
            key={item.key}
            component="button"
            type="button"
            onClick={() => navigate(item.path)}
            sx={{
              display: 'flex',
              width: '100%',
              justifyContent: 'flex-start',
              alignItems: 'center',
              gap: 1.5,
              p: { xs: 1.75, sm: 2 },
              borderRadius: getListCardRadius(getListCardPosition(index, sections.length)),
              textAlign: 'left',
              bgcolor: surfaceContainer(theme, 'low'),
              boxShadow: `0 1px 2px ${withThemeAlpha(theme, theme.palette.common.black, 0.08)}`,
              transition:
                'background-color 160ms ease, transform 160ms ease, box-shadow 160ms ease',
              '&:hover': {
                bgcolor: surfaceContainer(theme, 'default'),
                transform: 'translateY(-1px)',
                boxShadow: `0 6px 16px ${withThemeAlpha(theme, theme.palette.common.black, 0.12)}`
              },
              '&:focus-visible': {
                outline: `3px solid ${withThemeAlpha(theme, theme.palette.primary.main, 0.35)}`,
                outlineOffset: 2
              }
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                flexShrink: 0,
                borderRadius: '12px',
                bgcolor: withThemeAlpha(theme, theme.palette.primary.main, 0.14),
                color: 'primary.main'
              }}
            >
              {item.icon}
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 650, lineHeight: 1.25 }}>
                {item.title}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.45, display: { xs: 'none', sm: 'block' } }}
              >
                {item.description}
              </Typography>
              <Typography
                variant="caption"
                color="primary.main"
                sx={{ mt: 0.45, display: 'block' }}
              >
                {item.summary}
              </Typography>
            </Box>
            <ArrowForwardIosRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          </ButtonBase>
        ))}
      </Stack>
    </Box>
  )
}

export default SettingsOverviewPage
