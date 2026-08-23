import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined'
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined'
import DeleteSweepOutlinedIcon from '@mui/icons-material/DeleteSweepOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined'
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import LaunchOutlinedIcon from '@mui/icons-material/LaunchOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { LogLevel, LogsInfo } from '@shared/types/logger'
import { LOG_LEVELS, LOG_RETENTION_DAYS } from '@shared/types/logger'
import ContentSection from '../../../components/ui/ContentSection'
import SettingsCardList from '../../../components/settings/SettingsCardList'
import { surfaceContainer } from '../../../theme'

interface LogsSectionProps {
  logLevel: LogLevel
  onLogLevelChange: (level: LogLevel) => void
  logsInfo: LogsInfo | null
  onOpenFolder: () => void
  onOpenFile: (fileName: string) => void
  onClearLogs: () => void
}

const LEVEL_ICONS: Record<LogLevel, typeof BlockOutlinedIcon> = {
  off: BlockOutlinedIcon,
  error: ErrorOutlinedIcon,
  warn: WarningAmberOutlinedIcon,
  info: InfoOutlinedIcon,
  debug: BugReportOutlinedIcon
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function LogsSection({
  logLevel,
  onLogLevelChange,
  logsInfo,
  onOpenFolder,
  onOpenFile,
  onClearLogs
}: LogsSectionProps): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const totalSize = logsInfo?.files.reduce((sum, file) => sum + file.size, 0) ?? 0
  const hasFiles = (logsInfo?.files.length ?? 0) > 0

  return (
    <>
      <SettingsCardList>
        <ContentSection
          icon={<DescriptionOutlinedIcon fontSize="small" />}
          title={t('settings.logs.levelTitle')}
          description={t('settings.logs.levelHint')}
        >
          <ToggleButtonGroup
            value={logLevel}
            exclusive
            onChange={(_event, next: LogLevel | null) => {
              if (next) onLogLevelChange(next)
            }}
            fullWidth
            sx={{
              '& .MuiToggleButton-root': {
                py: 1.35,
                gap: 0.75,
                textTransform: 'none',
                fontWeight: 600
              }
            }}
          >
            {LOG_LEVELS.map((level) => {
              const Icon = LEVEL_ICONS[level]
              return (
                <ToggleButton
                  key={level}
                  value={level}
                  aria-label={t(`settings.logs.levels.${level}`)}
                >
                  <Icon fontSize="small" />
                  {t(`settings.logs.levels.${level}`)}
                </ToggleButton>
              )
            })}
          </ToggleButtonGroup>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.75, lineHeight: 1.5 }}>
            {t(`settings.logs.levelDescriptions.${logLevel}`)}
          </Typography>
        </ContentSection>

        <ContentSection
          icon={<FolderOpenOutlinedIcon fontSize="small" />}
          title={t('settings.logs.folderTitle')}
          description={t('settings.logs.folderHint', { days: LOG_RETENTION_DAYS })}
        >
          {logsInfo ? (
            <>
              <Box
                sx={{
                  px: 1.5,
                  py: 1.1,
                  borderRadius: '12px',
                  bgcolor: surfaceContainer(theme, 'high'),
                  border: `1px solid ${theme.palette.divider}`,
                  overflow: 'hidden'
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.78rem',
                    lineHeight: 1.5,
                    wordBreak: 'break-all',
                    color: 'text.secondary'
                  }}
                >
                  {logsInfo.dir}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap' }}>
                <Chip
                  size="small"
                  label={t('settings.logs.filesCount', { count: logsInfo.files.length })}
                  variant="outlined"
                  sx={{ fontWeight: 600 }}
                />
                <Chip
                  size="small"
                  label={formatBytes(totalSize)}
                  variant="outlined"
                  sx={{ fontWeight: 600 }}
                />
                {logsInfo.files[0] ? (
                  <Chip
                    size="small"
                    label={logsInfo.files[0].date}
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                ) : null}
              </Stack>

              {hasFiles ? (
                <>
                  <Divider sx={{ mt: 1.75, mb: 1.25, opacity: 0.7 }} />
                  <Stack spacing={0}>
                    {logsInfo.files.slice(0, 5).map((file) => (
                      <Box
                        key={file.name}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.25,
                          py: 0.75,
                          borderBottom: `1px solid ${theme.palette.divider}`,
                          '&:last-of-type': { borderBottom: 'none' }
                        }}
                      >
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: 'monospace',
                              fontWeight: 600,
                              fontSize: '0.82rem',
                              wordBreak: 'break-all',
                              lineHeight: 1.3
                            }}
                          >
                            {file.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontWeight: 500 }}
                          >
                            {formatBytes(file.size)}
                          </Typography>
                        </Box>
                        <Tooltip title={t('settings.logs.openFileHint')} arrow>
                          <IconButton
                            size="small"
                            aria-label={`${t('settings.logs.openFile')} ${file.name}`}
                            onClick={() => onOpenFile(file.name)}
                            sx={{
                              flexShrink: 0,
                              border: `1px solid ${theme.palette.divider}`,
                              borderRadius: '10px',
                              width: 34,
                              height: 34
                            }}
                          >
                            <LaunchOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    ))}
                    {logsInfo.files.length > 5 ? (
                      <Typography variant="caption" color="text.secondary" sx={{ pt: 1 }}>
                        {t('settings.logs.moreFiles', { count: logsInfo.files.length - 5 })}
                      </Typography>
                    ) : null}
                  </Stack>
                </>
              ) : null}
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              {t('settings.logs.folderHint', { days: LOG_RETENTION_DAYS })}
            </Typography>
          )}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ mt: 2 }}>
            <Button
              variant="contained"
              startIcon={<FolderOpenOutlinedIcon fontSize="small" />}
              onClick={onOpenFolder}
              sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700 }}
            >
              {t('settings.logs.openFolder')}
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteSweepOutlinedIcon fontSize="small" />}
              onClick={() => setConfirmOpen(true)}
              disabled={!hasFiles}
              sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700 }}
            >
              {t('settings.logs.clearLogs')}
            </Button>
          </Stack>
        </ContentSection>
      </SettingsCardList>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('settings.logs.clearLogsConfirmTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('settings.logs.clearLogsConfirmMessage', {
              count: logsInfo?.files.length ?? 0,
              size: formatBytes(totalSize)
            })}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setConfirmOpen(false)}
            sx={{ borderRadius: '10px', textTransform: 'none' }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              setConfirmOpen(false)
              onClearLogs()
            }}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}
          >
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default LogsSection
