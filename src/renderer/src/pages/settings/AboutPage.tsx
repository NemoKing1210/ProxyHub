import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded'
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined'
import LaunchOutlinedIcon from '@mui/icons-material/LaunchOutlined'
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined'
import { Alert, Box, Button, Chip, CircularProgress, Link, Stack, Tooltip, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AppInfo } from '@shared/types/app'
import type { AppUpdateState } from '@shared/types/updater'
import AppUpdateSection from './components/AppUpdateSection'
import ChangelogView from './components/ChangelogView'
import SettingsSectionHeader from './components/SettingsSectionHeader'
import ContentSection from '../../components/ui/ContentSection'
import SettingsCardList from '../../components/settings/SettingsCardList'
import { getListCardPosition, getListCardRadius } from '../../lib/card-list'
import { elevationShadow, MD3_DURATION, MD3_EASING, surfaceContainer, withThemeAlpha } from '../../theme'

function AboutPage(): React.JSX.Element {
  const { t, i18n } = useTranslation()
  const theme = useTheme()
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null)
  const [appInfoError, setAppInfoError] = useState(false)
  const [isAppInfoLoading, setIsAppInfoLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [updateState, setUpdateState] = useState<AppUpdateState | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadAppInfo = async (): Promise<void> => {
      setIsAppInfoLoading(true)
      setAppInfoError(false)

      try {
        const info = await window.api.getAppInfo()
        if (isMounted) {
          setAppInfo(info)
        }
      } catch {
        if (isMounted) {
          setAppInfoError(true)
        }
      } finally {
        if (isMounted) {
          setIsAppInfoLoading(false)
        }
      }
    }

    void loadAppInfo()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let active = true
    void window.api.getUpdateState().then((next) => {
      if (active) setUpdateState(next)
    })
    const unsubscribe = window.api.onUpdateStateChange((next) => {
      if (active) setUpdateState(next)
    })
    return () => {
      active = false
      unsubscribe?.()
    }
  }, [])

  const repositoryUrl = appInfo?.repositoryUrl ?? 'https://github.com/NemoKing1210/ProxyHub'
  const issuesUrl = `${repositoryUrl.replace(/\/$/, '')}/issues`
  const releasesUrl = `${repositoryUrl.replace(/\/$/, '')}/releases`

  const handleOpenExternal = (url: string): void => {
    void window.api.openExternal(url)
  }

  const handleCopyVersion = async (): Promise<void> => {
    if (!appInfo) return
    await navigator.clipboard.writeText(appInfo.version)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isUpdateVisible = updateState ? updateState.status !== 'disabled' : false
  const totalCards = 1 + (isUpdateVisible ? 1 : 0) + 1 + 1
  const heroRadius = getListCardRadius(getListCardPosition(0, totalCards))
  const footerRadius = getListCardRadius(getListCardPosition(totalCards - 1, totalCards))
  const changelogListRadius = getListCardRadius(getListCardPosition(isUpdateVisible ? 2 : 1, totalCards))

  return (
    <>
      <SettingsSectionHeader />
      <SettingsCardList>
        {/* HERO — stitched as the first card in the list */}
        <Box
          sx={{
            p: { xs: 2.5, sm: 3 },
            borderRadius: heroRadius,
            bgcolor: surfaceContainer(theme, 'low'),
            backgroundImage: `radial-gradient(560px 240px at 92% 0%, ${withThemeAlpha(theme, theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.18 : 0.12)} 0%, transparent 62%), radial-gradient(480px 260px at 4% 100%, ${withThemeAlpha(theme, theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.14 : 0.08)} 0%, transparent 66%)`,
            boxShadow: elevationShadow(theme, 1),
            overflow: 'hidden',
            position: 'relative',
            transition: `box-shadow ${MD3_DURATION.short4}ms ${MD3_EASING.standard}`,
            '&:hover': {
              boxShadow: elevationShadow(theme, 2)
            }
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', mb: 0.5 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                ProxyHub
              </Typography>
              <Chip
                icon={<VerifiedOutlinedIcon sx={{ fontSize: 14 }} />}
                label="MIT"
                size="small"
                variant="outlined"
                sx={{ height: 24, fontWeight: 600, fontSize: '0.74rem' }}
              />
            </Stack>

            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, maxWidth: 560 }}>
              {t('settings.aboutPage.heroSubtitle', {
                defaultValue:
                  'Cross-platform desktop app to check proxy availability in one click — HTTP, HTTPS, SOCKS4, SOCKS5 and MTProto with latency and external IP.'
              })}
            </Typography>

            {isAppInfoLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.75 }}>
                <CircularProgress size={16} />
                <Typography variant="caption" color="text.secondary">
                  {t('settings.updates.checking', { defaultValue: 'Loading...' })}
                </Typography>
              </Box>
            ) : appInfo ? (
              <Stack spacing={1.25} sx={{ mt: 2 }}>
                <Tooltip title={copied ? t('common.copied') : t('settings.aboutPage.copyVersion', { defaultValue: 'Copy version' })}>
                  <Chip
                    clickable
                    onClick={() => void handleCopyVersion()}
                    icon={
                      copied ? (
                        <CheckCircleOutlineRoundedIcon sx={{ fontSize: 16 }} />
                      ) : (
                        <ContentCopyRoundedIcon sx={{ fontSize: 14 }} />
                      )
                    }
                    label={copied ? t('common.copied') : `v${appInfo.version}`}
                    size="small"
                    sx={{
                      alignSelf: 'flex-start',
                      height: 26,
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      bgcolor: withThemeAlpha(theme, theme.palette.primary.main, 0.08)
                    }}
                  />
                </Tooltip>

                {(appInfo.author || appInfo.authorEmail || appInfo.repositoryUrl) && (
                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                    {appInfo.author ?? 'NemoKing1210'}
                    {appInfo.authorEmail ? ` · ${appInfo.authorEmail}` : ''}
                  </Typography>
                )}
              </Stack>
            ) : null}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 2.25 }}>
              <Button
                variant="contained"
                size="small"
                startIcon={<LaunchOutlinedIcon fontSize="small" />}
                onClick={() => handleOpenExternal(repositoryUrl)}
                sx={{ borderRadius: '999px', px: 2, fontWeight: 700 }}
              >
                {t('settings.aboutPage.openGithub', { defaultValue: 'Open GitHub' })}
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => handleOpenExternal(releasesUrl)}
                sx={{ borderRadius: '999px', px: 2, fontWeight: 600 }}
              >
                {t('settings.aboutPage.releases', { defaultValue: 'Releases' })}
              </Button>
              <Button
                variant="text"
                size="small"
                onClick={() => handleOpenExternal(issuesUrl)}
                sx={{ borderRadius: '999px', px: 1.75, fontWeight: 600 }}
              >
                {t('settings.aboutPage.reportBug', { defaultValue: 'Report a bug' })}
              </Button>
            </Stack>

            <Stack direction="row" spacing={0.75} sx={{ mt: 2, flexWrap: 'wrap' }}>
              {['Electron', 'React', 'TypeScript', 'MUI'].map((tech) => (
                <Chip
                  key={tech}
                  label={tech}
                  size="small"
                  variant="outlined"
                  sx={{
                    height: 22,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    bgcolor: withThemeAlpha(theme, theme.palette.background.paper, 0.6),
                    backdropFilter: 'blur(6px)'
                  }}
                />
              ))}
              <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center', ml: 0.5 }}>
                · {new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(new Date())}
              </Typography>
            </Stack>
          </Box>
        </Box>

        {isUpdateVisible && <AppUpdateSection listRadius={getListCardRadius(getListCardPosition(1, totalCards))} />}

        {/* CHANGELOG — receives radius via SettingsCardList, duplicated for consistency with manual calculation */}
        <ContentSection
          icon={<HistoryOutlinedIcon fontSize="small" />}
          title={t('settings.aboutPage.changelogTitle', { defaultValue: t('settings.currentVersion') })}
          description={t('settings.aboutPage.changelogDesc', {
            defaultValue: 'Version history — what was added, changed and fixed in each release.'
          })}
          listRadius={changelogListRadius}
        >
          {isAppInfoLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : appInfoError ? (
            <Alert severity="error" variant="outlined">
              {t('settings.changelogLoadError')}
            </Alert>
          ) : appInfo ? (
            <ChangelogView
              version={appInfo.version}
              entries={appInfo.changelog}
              author={appInfo.author}
              authorEmail={appInfo.authorEmail}
              repositoryUrl={appInfo.repositoryUrl}
            />
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              {t('settings.changelogEmpty')}
            </Typography>
          )}
        </ContentSection>

        {/* FOOTER — last card in the list, dashed keeps accent but radius is stitched */}
        <Box
          sx={{
            p: { xs: 2.5, sm: 3 },
            borderRadius: footerRadius,
            bgcolor: surfaceContainer(theme, 'low'),
            border: `1px dashed ${withThemeAlpha(theme, theme.palette.divider, 0.7)}`,
            boxShadow: elevationShadow(theme, 1),
            transition: `box-shadow ${MD3_DURATION.short4}ms ${MD3_EASING.standard}`,
            '&:hover': {
              boxShadow: elevationShadow(theme, 2)
            },
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1.25,
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
            © {new Date().getFullYear()} ProxyHub · {t('settings.aboutPage.madeWith', { defaultValue: 'Made with' })} ❤️{' '}
            {appInfo?.author ?? 'NemoKing1210'} · MIT
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            <Link
              href={repositoryUrl}
              underline="hover"
              sx={{ fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
              onClick={(e) => {
                e.preventDefault()
                handleOpenExternal(repositoryUrl)
              }}
            >
              GitHub
            </Link>
            <Typography variant="caption" color="text.secondary">
              ·
            </Typography>
            <Link
              href={releasesUrl}
              underline="hover"
              sx={{ fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
              onClick={(e) => {
                e.preventDefault()
                handleOpenExternal(releasesUrl)
              }}
            >
              Releases
            </Link>
          </Stack>
        </Box>
      </SettingsCardList>
    </>
  )
}

export default AboutPage
