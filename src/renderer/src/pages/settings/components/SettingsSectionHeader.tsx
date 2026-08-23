import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import { Box, IconButton, Stack, Typography } from '@mui/material'
import { useMatch, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { isSettingsSectionKey, useSettingsSections } from '../sectionsRegistry'

/**
 * Settings subpage header: back button to the category list, section title
 * and description. Rendered inside the subpage itself (not in the shared
 * /settings route), so it appears and disappears with it during animated
 * transitions.
 */
function SettingsSectionHeader(): React.JSX.Element | null {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const match = useMatch('/settings/:section')
  const sectionParam = match?.params.section
  const sections = useSettingsSections()

  const currentSection = isSettingsSectionKey(sectionParam)
    ? (sections.find((item) => item.key === sectionParam) ?? null)
    : null

  if (!currentSection) return null

  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
        <IconButton
          aria-label={t('settings.backToSettings')}
          onClick={() => navigate('/settings')}
          size="small"
          sx={{
            ml: -1,
            color: 'text.secondary',
            transition: (theme) =>
              `color ${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}`
          }}
        >
          <ArrowBackRoundedIcon />
        </IconButton>
        <Typography variant="h5" component="h1">
          {currentSection.title}
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        {currentSection.description}
      </Typography>
    </Box>
  )
}

export default SettingsSectionHeader
