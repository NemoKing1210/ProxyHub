import AddIcon from '@mui/icons-material/Add'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import {
  Alert,
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES, type AppLanguage, type ThemeMode } from '../../../shared/types/settings'
import { useSettingsStore } from '../store/settingsStore'
import { normalizeDomainInput, validateDomain } from '../validation/proxySchema'

function SettingsPage(): React.JSX.Element {
  const { t } = useTranslation()
  const { settings, setTheme, setLanguage, setCheckDomains } = useSettingsStore()
  const [domainInput, setDomainInput] = useState('')
  const [domainError, setDomainError] = useState<string | null>(null)
  const [savedOpen, setSavedOpen] = useState(false)

  const handleThemeChange = async (theme: ThemeMode): Promise<void> => {
    await setTheme(theme)
    setSavedOpen(true)
  }

  const handleLanguageChange = async (language: AppLanguage): Promise<void> => {
    await setLanguage(language)
    setSavedOpen(true)
  }

  const handleAddDomain = async (): Promise<void> => {
    const error = validateDomain(domainInput, settings.checkDomains, t)
    if (error) {
      setDomainError(error)
      return
    }

    const domain = normalizeDomainInput(domainInput)
    await setCheckDomains([...settings.checkDomains, domain])
    setDomainInput('')
    setDomainError(null)
    setSavedOpen(true)
  }

  const handleRemoveDomain = async (domain: string): Promise<void> => {
    if (settings.checkDomains.length <= 1) {
      setDomainError(t('settings.domainRequired'))
      return
    }

    await setCheckDomains(settings.checkDomains.filter((item) => item !== domain))
    setDomainError(null)
    setSavedOpen(true)
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        {t('settings.title')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t('settings.description')}
      </Typography>

      <Stack spacing={3}>
        <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider' }}>
          <TextField
            select
            label={t('settings.theme')}
            value={settings.theme}
            onChange={(event) => void handleThemeChange(event.target.value as ThemeMode)}
            fullWidth
          >
            <MenuItem value="light">{t('settings.themeLight')}</MenuItem>
            <MenuItem value="dark">{t('settings.themeDark')}</MenuItem>
            <MenuItem value="system">{t('settings.themeSystem')}</MenuItem>
          </TextField>
        </Paper>

        <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider' }}>
          <TextField
            select
            label={t('settings.language')}
            value={settings.language}
            onChange={(event) => void handleLanguageChange(event.target.value as AppLanguage)}
            fullWidth
          >
            {SUPPORTED_LANGUAGES.map((language) => (
              <MenuItem key={language.code} value={language.code}>
                {language.label}
              </MenuItem>
            ))}
          </TextField>
        </Paper>

        <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle1" gutterBottom>
            {t('settings.checkDomains')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('settings.checkDomainsHint')}
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }}>
            <TextField
              label={t('settings.addDomain')}
              placeholder={t('settings.domainPlaceholder')}
              value={domainInput}
              onChange={(event) => {
                setDomainInput(event.target.value)
                setDomainError(null)
              }}
              error={Boolean(domainError)}
              helperText={domainError}
              fullWidth
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  void handleAddDomain()
                }
              }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => void handleAddDomain()}
              sx={{ minWidth: { sm: 160 }, alignSelf: { xs: 'stretch', sm: 'flex-start' } }}
            >
              {t('common.add')}
            </Button>
          </Stack>

          <List dense>
            {settings.checkDomains.map((domain) => (
              <ListItem
                key={domain}
                secondaryAction={
                  <IconButton
                    edge="end"
                    color="error"
                    onClick={() => void handleRemoveDomain(domain)}
                    disabled={settings.checkDomains.length <= 1}
                  >
                    <DeleteOutlinedIcon />
                  </IconButton>
                }
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1
                }}
              >
                <ListItemText primary={domain} sx={{ fontFamily: 'monospace' }} />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Stack>

      <Snackbar
        open={savedOpen}
        autoHideDuration={2000}
        onClose={() => setSavedOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" onClose={() => setSavedOpen(false)}>
          {t('settings.saved')}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default SettingsPage
