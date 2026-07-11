import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import LaunchOutlinedIcon from '@mui/icons-material/LaunchOutlined'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Avatar,
  Box,
  Chip,
  Link,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import type { ChangelogEntry } from '../../../shared/types/app'
import { resolveGitHubAvatarUrl, resolveGitHubProfileUrl } from '../../../shared/utils/github'
import { MD3_DURATION, MD3_EASING, surfaceContainer } from '../theme'

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

  if (Number.isNaN(parsed.getTime())) {
    return date
  }

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

  const repositoryLabel = repositoryUrl?.replace(/^https?:\/\//, '')
  const authorProfileUrl = resolveGitHubProfileUrl(repositoryUrl, author)
  const authorAvatarUrl = resolveGitHubAvatarUrl(repositoryUrl, author)

  const handleEmailClick = (event: React.MouseEvent<HTMLAnchorElement>): void => {
    if (!authorEmail) return

    event.preventDefault()
    void window.api.openExternal(`mailto:${authorEmail}`)
  }

  return (
    <Stack spacing={2.5}>
      <Box
        sx={{
          p: 2,
          borderRadius: 2.5,
          bgcolor: surfaceContainer(theme, 'low')
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            mb: author || authorEmail || repositoryUrl ? 2 : 0
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
        </Stack>

        {(author || authorEmail || repositoryUrl) && (
          <Stack spacing={1.25}>
            {(author || authorEmail) && (
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mb: 0.75 }}
                >
                  {t('settings.developer')}
                </Typography>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                  {authorAvatarUrl && (
                    <Link
                      href={authorProfileUrl ?? authorAvatarUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      underline="none"
                      aria-label={author}
                      sx={{ mt: authorEmail ? 0.15 : 0 }}
                    >
                      <Avatar
                        src={authorAvatarUrl}
                        alt={author}
                        sx={{
                          width: 44,
                          height: 44,
                          border: '1px solid',
                          borderColor: 'divider'
                        }}
                      />
                    </Link>
                  )}
                  <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                    {author &&
                      (authorProfileUrl ? (
                        <Link
                          href={authorProfileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          underline="hover"
                          sx={{ fontWeight: 600 }}
                        >
                          {author}
                        </Link>
                      ) : (
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {author}
                        </Typography>
                      ))}
                    {authorEmail && (
                      <Link
                        href={`mailto:${authorEmail}`}
                        onClick={handleEmailClick}
                        underline="hover"
                        color="text.secondary"
                        sx={{
                          fontSize: '0.875rem',
                          wordBreak: 'break-all'
                        }}
                      >
                        {authorEmail}
                      </Link>
                    )}
                  </Stack>
                </Stack>
              </Box>
            )}

            {repositoryUrl && (
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mb: 0.25 }}
                >
                  {t('settings.repository')}
                </Typography>
                <Link
                  href={repositoryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  underline="hover"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    fontWeight: 600,
                    wordBreak: 'break-all'
                  }}
                >
                  {repositoryLabel ?? repositoryUrl}
                  <LaunchOutlinedIcon sx={{ fontSize: 16, flexShrink: 0 }} />
                </Link>
              </Box>
            )}
          </Stack>
        )}
      </Box>

      {entries.length > 0 ? (
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
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          {t('settings.changelogEmpty')}
        </Typography>
      )}
    </Stack>
  )
}

export default ChangelogView
