import { Box, Breadcrumbs, Typography } from '@mui/material'
import { Outlet, useMatch, Link as RouterLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { isSettingsSectionKey, useSettingsSections } from './sectionsRegistry'
import { SettingsFeedbackProvider } from './feedback/SettingsFeedbackProvider'

/**
 * Оболочка настроек: маршруты /settings (список категорий) и /settings/:section
 * (отдельная страница категории). Содержимое рендерится через Outlet из
 * страниц в ./settings, обратная связь (снекбары) общая для всех подстраниц.
 */
function SettingsPage(): React.JSX.Element {
  const { t } = useTranslation()
  const match = useMatch('/settings/:section')
  const sectionParam = match?.params.section
  const selectedSection = isSettingsSectionKey(sectionParam) ? sectionParam : null

  const sections = useSettingsSections()
  const currentSection = sections.find((item) => item.key === selectedSection)

  return (
    <Box sx={{ width: '100%' }}>
      <SettingsFeedbackProvider>
        {selectedSection && currentSection ? (
          <Box>
            <Typography variant="h5">{currentSection.title}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {currentSection.description}
            </Typography>
            <Breadcrumbs
              aria-label={t('settings.breadcrumbsLabel')}
              separator="/"
              sx={{ mt: 1.25, color: 'text.secondary' }}
            >
              <Typography
                component={RouterLink}
                to="/settings"
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  textDecoration: 'none',
                  '&:hover': { color: 'primary.main', textDecoration: 'underline' }
                }}
              >
                {t('settings.title')}
              </Typography>
              <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600 }}>
                {currentSection.title}
              </Typography>
            </Breadcrumbs>
          </Box>
        ) : null}

        <Box sx={{ mt: currentSection ? 3 : 0 }}>
          <Outlet />
        </Box>
      </SettingsFeedbackProvider>
    </Box>
  )
}

export default SettingsPage
