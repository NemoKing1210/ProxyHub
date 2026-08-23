import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined'
import UpdateOutlinedIcon from '@mui/icons-material/UpdateOutlined'
import { Alert, Box, CircularProgress, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AppInfo } from '@shared/types/app'
import AppUpdateSection from '../../components/AppUpdateSection'
import ChangelogView from '../../components/ChangelogView'
import ContentSection from '../../components/ui/ContentSection'
import SettingsCardList from '../../components/SettingsCardList'

function AboutPage(): React.JSX.Element {
  const { t } = useTranslation()
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null)
  const [appInfoError, setAppInfoError] = useState(false)
  const [isAppInfoLoading, setIsAppInfoLoading] = useState(true)

  // IPC-запрос выполняется только при открытии страницы «О программе».
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

  return (
    <SettingsCardList>
      <ContentSection
        icon={<UpdateOutlinedIcon fontSize="small" />}
        title={t('settings.updates.title')}
      >
        <AppUpdateSection />
      </ContentSection>

      <ContentSection
        icon={<HistoryOutlinedIcon fontSize="small" />}
        title={t('settings.currentVersion')}
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
    </SettingsCardList>
  )
}

export default AboutPage
