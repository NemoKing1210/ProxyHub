import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import TagOutlinedIcon from '@mui/icons-material/TagOutlined'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Link,
  Stack,
  Typography
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import type { ChangelogEntry } from '@shared/types/app'
import { getListCardPosition, getListCardRadius } from '../../../lib/card-list'
import { MD3_DURATION, MD3_EASING, surfaceContainer, withThemeAlpha } from '../../../theme'

interface ChangelogViewProps {
  version: string
  entries: ChangelogEntry[]
  author?: string
  authorEmail?: string
  repositoryUrl?: string
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
  if (Number.isNaN(parsed.getTime())) return date
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(parsed)
}

function ChangelogView({
  version,
  entries,
  author,
  authorEmail,
  repositoryUrl
}: ChangelogViewProps): React.JSX.Element {
  const { t, i18n } = useTranslation()
  const theme = useTheme()
  const visibleEntries = entries.filter((entry) => entry.version.toLowerCase() !== 'unreleased')

  if (visibleEntries.length === 0) {
    return (
      <Box
        sx={{
          p: 3,
          borderRadius: '16px',
          bgcolor: surfaceContainer(theme, 'low'),
          border: `1px dashed ${withThemeAlpha(theme, theme.palette.divider, 0.7)}`,
          textAlign: 'center'
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          {t('settings.changelogEmpty')}
        </Typography>
      </Box>
    )
  }

  return (
    <Stack spacing={2}>
      {/* Author mini if needed - compact */}
      {(author || authorEmail) && (
        <Box
          sx={{
            display: 'none' // hidden because hero already shows author; keep for standalone usage
          }}
        />
      )}

      <Box
        sx={{
          maxHeight: 560,
          overflowY: 'auto',
          pr: 0.75,
          py: 0.5,
          scrollbarWidth: 'thin',
          scrollbarColor: `${withThemeAlpha(theme, theme.palette.primary.main, 0.28)} transparent`,
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: withThemeAlpha(theme, theme.palette.primary.main, 0.22),
            borderRadius: 999
          }
        }}
      >
        <Stack spacing={1.25}>
          {visibleEntries.map((entry, index) => {
            const releaseDate = formatReleaseDate(entry.date, i18n.language)
            const isCurrent = entry.version === version
            const isFirst = index === 0

            return (
              <Box key={entry.version}>
                <Accordion
                  defaultExpanded={isFirst}
                  disableGutters
                  elevation={0}
                  sx={{
                    borderRadius: `${getListCardRadius(getListCardPosition(index, visibleEntries.length))} !important`,
                    overflow: 'hidden',
                    bgcolor: isCurrent
                      ? withThemeAlpha(theme, theme.palette.primary.main, 0.08)
                      : surfaceContainer(theme, 'low'),
                    border: `1px solid ${isCurrent ? withThemeAlpha(theme, theme.palette.primary.main, 0.22) : withThemeAlpha(theme, theme.palette.divider, 0.5)}`,
                    transition: `all ${MD3_DURATION.short4}ms ${MD3_EASING.standard}`,
                    '&:before': { display: 'none' },
                    '&.Mui-expanded': {
                      margin: 0,
                      bgcolor: isCurrent
                        ? withThemeAlpha(theme, theme.palette.primary.main, 0.1)
                        : surfaceContainer(theme, 'default')
                    }
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon fontSize="small" />}
                    sx={{
                      minHeight: 56,
                      px: 2,
                      '& .MuiAccordionSummary-content': {
                        my: 1,
                        alignItems: 'center',
                        gap: 1,
                        flexWrap: 'wrap'
                      }
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ alignItems: 'center', flexWrap: 'wrap', flex: 1, minWidth: 0 }}
                    >
                      <Chip
                        icon={<TagOutlinedIcon sx={{ fontSize: 14 }} />}
                        label={`v${entry.version}`}
                        size="small"
                        color={isCurrent ? 'primary' : 'default'}
                        variant={isCurrent ? 'filled' : 'outlined'}
                        sx={{
                          fontFamily: 'monospace',
                          fontWeight: 800,
                          height: 24,
                          fontSize: '0.78rem',
                          ...(isCurrent
                            ? {}
                            : {
                                bgcolor: withThemeAlpha(theme, theme.palette.background.paper, 0.7),
                                borderColor: withThemeAlpha(theme, theme.palette.divider, 0.7)
                              })
                        }}
                      />
                      {isCurrent && (
                        <Chip
                          label={t('settings.latestRelease')}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{
                            height: 20,
                            fontSize: '0.66rem',
                            fontWeight: 800,
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase'
                          }}
                        />
                      )}
                      {isFirst && !isCurrent && (
                        <Chip
                          label="Latest"
                          size="small"
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.66rem', fontWeight: 700, opacity: 0.7 }}
                        />
                      )}
                    </Stack>

                    {releaseDate && (
                      <Stack
                        direction="row"
                        spacing={0.6}
                        sx={{
                          alignItems: 'center',
                          ml: 'auto',
                          mr: 1,
                          flexShrink: 0,
                          color: 'text.secondary'
                        }}
                      >
                        <CalendarMonthOutlinedIcon sx={{ fontSize: 14 }} />
                        <Typography
                          variant="caption"
                          sx={{ whiteSpace: 'nowrap', fontWeight: 500 }}
                        >
                          {releaseDate}
                        </Typography>
                      </Stack>
                    )}
                  </AccordionSummary>

                  <AccordionDetails sx={{ px: 2, pt: 0, pb: 2 }}>
                    <Stack spacing={1.75}>
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
                                fontWeight: 800,
                                fontSize: '0.7rem',
                                height: 22,
                                letterSpacing: '0.02em'
                              }}
                            />
                            <Stack spacing={0.6} sx={{ pl: 0.25 }}>
                              {section.items.map((item) => (
                                <Stack
                                  key={`${entry.version}-${section.title}-${item}`}
                                  direction="row"
                                  spacing={1}
                                  sx={{ alignItems: 'flex-start' }}
                                >
                                  <Box
                                    component="span"
                                    sx={{
                                      mt: 0.85,
                                      width: 6,
                                      height: 6,
                                      borderRadius: '50%',
                                      flexShrink: 0,
                                      bgcolor: isCurrent ? 'primary.main' : 'text.secondary',
                                      opacity: isCurrent ? 1 : 0.45
                                    }}
                                  />
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      lineHeight: 1.55,
                                      color: 'text.primary',
                                      fontSize: '0.86rem'
                                    }}
                                  >
                                    {item}
                                  </Typography>
                                </Stack>
                              ))}
                            </Stack>
                          </Box>
                        )
                      })}
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              </Box>
            )
          })}
        </Stack>
      </Box>

      {repositoryUrl && (
        <Stack direction="row" spacing={1} sx={{ justifyContent: 'center', pt: 0.5 }}>
          <Link
            href={`${repositoryUrl.replace(/\/$/, '')}/blob/main/CHANGELOG.md`}
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            onClick={(e) => {
              e.preventDefault()
              void window.api.openExternal(
                `${repositoryUrl.replace(/\/$/, '')}/blob/main/CHANGELOG.md`
              )
            }}
            sx={{ fontSize: '0.8rem', fontWeight: 600 }}
          >
            {t('settings.aboutPage.viewFullChangelog', {
              defaultValue: 'Full changelog on GitHub'
            })}{' '}
            →
          </Link>
        </Stack>
      )}
    </Stack>
  )
}

export default ChangelogView
