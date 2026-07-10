import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import type { ChangelogEntry } from '../../../shared/types/app'
import { MD3_DURATION, MD3_EASING, surfaceContainer } from '../theme'

interface ChangelogViewProps {
  version: string
  entries: ChangelogEntry[]
}

const SECTION_COLOR_MAP: Record<string, 'success' | 'info' | 'warning' | 'error' | 'default'> = {
  Added: 'success',
  Changed: 'info',
  Deprecated: 'warning',
  Removed: 'error',
  Fixed: 'warning',
  Security: 'error'
}

const SECTION_I18N_KEYS: Record<string, string> = {
  Added: 'settings.changelogSections.added',
  Changed: 'settings.changelogSections.changed',
  Deprecated: 'settings.changelogSections.deprecated',
  Removed: 'settings.changelogSections.removed',
  Fixed: 'settings.changelogSections.fixed',
  Security: 'settings.changelogSections.security'
}

function formatReleaseDate(date: string | undefined, locale: string): string | null {
  if (!date) return null

  const parsed = new Date(`${date}T00:00:00`)

  if (Number.isNaN(parsed.getTime())) {
    return date
  }

  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(parsed)
}

function ChangelogView({ version, entries }: ChangelogViewProps): React.JSX.Element {
  const { t, i18n } = useTranslation()
  const theme = useTheme()

  return (
    <Stack spacing={2.5}>
      <Box
        sx={{
          display: 'flex',
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          flexDirection: { xs: 'column', sm: 'row' },
          p: 2,
          borderRadius: 2.5,
          bgcolor: surfaceContainer(theme, 'low')
        }}
      >
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
            {t('settings.currentVersion')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ProxyChecker
          </Typography>
        </Box>
        <Chip
          label={`v${version}`}
          color="primary"
          sx={{
            fontWeight: 700,
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            px: 0.5,
            height: 32
          }}
        />
      </Box>

      <Box
        sx={{
          maxHeight: 520,
          overflowY: 'auto',
          pr: 0.5,
          borderRadius: 2.5
        }}
      >
        <Stack spacing={1}>
          {entries.map((entry, index) => {
            const releaseDate = formatReleaseDate(entry.date, i18n.language)
            const isCurrent = entry.version === version

            return (
              <Accordion
                key={entry.version}
                defaultExpanded={index === 0}
                disableGutters
                elevation={0}
                sx={{
                  borderRadius: '12px !important',
                  overflow: 'hidden',
                  bgcolor: surfaceContainer(theme, 'low'),
                  transition: `background-color ${MD3_DURATION.short4}ms ${MD3_EASING.standard}`,
                  '&:before': { display: 'none' },
                  '&.Mui-expanded': {
                    bgcolor: surfaceContainer(theme, 'default'),
                    margin: 0
                  }
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon fontSize="small" />}
                  sx={{
                    minHeight: 52,
                    px: 2,
                    '& .MuiAccordionSummary-content': {
                      my: 1.25,
                      alignItems: 'center',
                      gap: 1
                    }
                  }}
                >
                  <Typography
                    component="span"
                    sx={{
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      color: isCurrent ? 'primary.main' : 'text.primary'
                    }}
                  >
                    v{entry.version}
                  </Typography>
                  {isCurrent && (
                    <Chip
                      label={t('settings.latestRelease')}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ height: 22, fontSize: '0.68rem', fontWeight: 700 }}
                    />
                  )}
                  {releaseDate && (
                    <Typography
                      component="span"
                      variant="caption"
                      color="text.secondary"
                      sx={{ ml: 'auto', mr: 1, whiteSpace: 'nowrap' }}
                    >
                      {releaseDate}
                    </Typography>
                  )}
                </AccordionSummary>

                <AccordionDetails sx={{ px: 2, pt: 0, pb: 2 }}>
                  <Stack spacing={2}>
                    {entry.sections.map((section) => {
                      const sectionKey = SECTION_I18N_KEYS[section.title]
                      const sectionLabel = sectionKey ? t(sectionKey) : section.title

                      return (
                        <Box key={`${entry.version}-${section.title}`}>
                          <Chip
                            label={sectionLabel}
                            size="small"
                            color={SECTION_COLOR_MAP[section.title] ?? 'default'}
                            sx={{
                              mb: 1,
                              fontWeight: 700,
                              border: 'none'
                            }}
                          />
                          <List dense disablePadding sx={{ pl: 0.5 }}>
                            {section.items.map((item) => (
                              <ListItem
                                key={`${entry.version}-${section.title}-${item}`}
                                disableGutters
                                sx={{
                                  alignItems: 'flex-start',
                                  py: 0.35,
                                  gap: 1
                                }}
                              >
                                <Box
                                  component="span"
                                  sx={{
                                    mt: 0.85,
                                    width: 5,
                                    height: 5,
                                    borderRadius: '50%',
                                    flexShrink: 0,
                                    bgcolor: 'primary.main',
                                    opacity: 0.55
                                  }}
                                />
                                <ListItemText
                                  primary={item}
                                  slotProps={{
                                    primary: {
                                      variant: 'body2',
                                      sx: {
                                        lineHeight: 1.55,
                                        color: 'text.primary'
                                      }
                                    }
                                  }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )
                    })}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            )
          })}
        </Stack>
      </Box>
    </Stack>
  )
}

export default ChangelogView
