import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined'
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined'
import StarOutlinedIcon from '@mui/icons-material/StarOutlined'
import ViewListOutlinedIcon from '@mui/icons-material/ViewListOutlined'
import {
  Box,
  Checkbox,
  Collapse,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Slider
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ProxyGroup } from '../../../shared/types/proxy-group'
import {
  AUTO_CHECK_INTERVAL_MAX,
  AUTO_CHECK_INTERVAL_MIN,
  type AutoCheckScope
} from '../../../shared/types/settings'
import ContentSection from './ContentSection'
import AutoCheckCountdownBadge from './AutoCheckCountdownBadge'
import ProxyGroupAvatar from './ProxyGroupAvatar'
import SettingsSwitchCard from './SettingsSwitchCard'
import { MD3_DURATION, MD3_EASING, outlineVariant, surfaceContainer } from '../theme'

const INTERVAL_MARKS = [
  { value: 1, label: '1' },
  { value: 5, label: '5' },
  { value: 15, label: '15' },
  { value: 30, label: '30' },
  { value: 60, label: '60' },
  { value: 120, label: '120' },
  { value: 360, label: '360' }
]

function clampIntervalMinutes(value: number): number {
  return Math.min(AUTO_CHECK_INTERVAL_MAX, Math.max(AUTO_CHECK_INTERVAL_MIN, Math.round(value)))
}

interface SettingsAutoCheckSectionProps {
  enabled: boolean
  intervalMinutes: number
  notifications: boolean
  scope: AutoCheckScope
  groupIds: string[]
  groups: ProxyGroup[]
  favoriteCount: number
  onEnabledChange: (enabled: boolean) => void
  onIntervalChange: (minutes: number) => void
  onNotificationsChange: (enabled: boolean) => void
  onScopeChange: (scope: AutoCheckScope) => void
  onGroupIdsChange: (groupIds: string[]) => void
}

function SettingsAutoCheckSection({
  enabled,
  intervalMinutes,
  notifications,
  scope,
  groupIds,
  groups,
  favoriteCount,
  onEnabledChange,
  onIntervalChange,
  onNotificationsChange,
  onScopeChange,
  onGroupIdsChange
}: SettingsAutoCheckSectionProps): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const [intervalDraft, setIntervalDraft] = useState(intervalMinutes)
  const [isDraggingInterval, setIsDraggingInterval] = useState(false)

  useEffect(() => {
    if (!isDraggingInterval) {
      setIntervalDraft(intervalMinutes)
    }
  }, [intervalMinutes, isDraggingInterval])

  const displayedInterval = isDraggingInterval ? intervalDraft : intervalMinutes
  const selectedGroupSet = new Set(groupIds)

  const formatIntervalLabel = (minutes: number): string => {
    if (minutes >= 60 && minutes % 60 === 0) {
      return t('settings.autoCheckIntervalHours', { value: minutes / 60 })
    }

    return t('settings.autoCheckIntervalMinutes', { value: minutes })
  }

  const handleScopeChange = (
    _event: React.MouseEvent<HTMLElement>,
    nextScope: AutoCheckScope | null
  ): void => {
    if (!nextScope || nextScope === scope) return
    onScopeChange(nextScope)
  }

  const handleGroupToggle = (groupId: string, checked: boolean): void => {
    if (checked) {
      onGroupIdsChange([...groupIds, groupId])
      return
    }

    onGroupIdsChange(groupIds.filter((id) => id !== groupId))
  }

  const showFavoritesWarning = enabled && scope === 'favorites' && favoriteCount === 0
  const showGroupsWarning = enabled && scope === 'groups' && groupIds.length === 0
  const showGroupsEmpty = scope === 'groups' && groups.length === 0

  return (
    <ContentSection
      icon={<AutorenewOutlinedIcon fontSize="small" />}
      title={
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          sx={{ alignItems: 'center', flexWrap: 'wrap' }}
        >
          <span>{t('settings.sections.autoCheck')}</span>
          <AutoCheckCountdownBadge enabled={enabled} />
        </Stack>
      }
      description={t('settings.sections.autoCheckDescription')}
      showHeader={false}
    >
      <Stack spacing={2}>
        <Box
          sx={{
            borderRadius: '16px'
          }}
        >
          <SettingsSwitchCard
            icon={<AutorenewOutlinedIcon fontSize="small" />}
            title={t('settings.autoCheckEnabled')}
            hint={t('settings.autoCheckEnabledHint')}
            checked={enabled}
            onChange={onEnabledChange}
            clickable
          />

          <Collapse in={enabled} mountOnEnter unmountOnExit>
            <Box
              sx={{
                borderTop: `1px solid ${outlineVariant(theme)}`,
                bgcolor: surfaceContainer(theme, 'default'),
                px: 1.75,
                py: 2.25
              }}
            >
              <Stack spacing={2.75}>
                <Box>
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ mb: 1.25, alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <Typography variant="subtitle2">{t('settings.autoCheckInterval')}</Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: '12px',
                        bgcolor: surfaceContainer(theme, 'high'),
                        color: 'primary.main'
                      }}
                    >
                      {formatIntervalLabel(displayedInterval)}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {t('settings.autoCheckIntervalHint')}
                  </Typography>
                  <Slider
                    value={displayedInterval}
                    onChange={(_event, value) => {
                      const minutes = Array.isArray(value) ? value[0] : value
                      setIsDraggingInterval(true)
                      setIntervalDraft(clampIntervalMinutes(minutes))
                    }}
                    onChangeCommitted={() => {
                      setIsDraggingInterval(false)
                      if (intervalDraft !== intervalMinutes) {
                        onIntervalChange(intervalDraft)
                      }
                    }}
                    min={AUTO_CHECK_INTERVAL_MIN}
                    max={360}
                    step={1}
                    marks={INTERVAL_MARKS}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => formatIntervalLabel(value)}
                    sx={{ px: 0.5 }}
                  />
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 0.75 }}>
                    {t('settings.autoCheckScope')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    {t('settings.autoCheckScopeHint')}
                  </Typography>
                  <ToggleButtonGroup
                    value={scope}
                    exclusive
                    onChange={handleScopeChange}
                    fullWidth
                    sx={{
                      '& .MuiToggleButton-root': {
                        py: 1.35,
                        gap: 0.75,
                        flexDirection: 'column',
                        lineHeight: 1.2
                      }
                    }}
                  >
                    <ToggleButton value="all">
                      <ViewListOutlinedIcon fontSize="small" />
                      {t('settings.autoCheckScopeAll')}
                    </ToggleButton>
                    <ToggleButton value="favorites">
                      <StarOutlinedIcon fontSize="small" />
                      {t('settings.autoCheckScopeFavorites')}
                    </ToggleButton>
                    <ToggleButton value="groups">
                      <FolderOutlinedIcon fontSize="small" />
                      {t('settings.autoCheckScopeGroups')}
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>

                {scope === 'groups' && (
                  <Box>
                    {showGroupsEmpty ? (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontStyle: 'italic' }}
                      >
                        {t('settings.autoCheckGroupsEmpty')}
                      </Typography>
                    ) : (
                      <Stack spacing={0.75}>
                        {groups.map((group) => {
                          const checked = selectedGroupSet.has(group.id)

                          return (
                            <Box
                              key={group.id}
                              onClick={() => handleGroupToggle(group.id, !checked)}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.25,
                                px: 1.5,
                                py: 1.1,
                                borderRadius: '12px',
                                cursor: 'pointer',
                                bgcolor: checked
                                  ? surfaceContainer(theme, 'high')
                                  : surfaceContainer(theme, 'low'),
                                opacity: checked ? 1 : 0.82,
                                transition: `background-color ${MD3_DURATION.short4}ms ${MD3_EASING.standard}, transform ${MD3_DURATION.short3}ms ${MD3_EASING.standard}, opacity ${MD3_DURATION.short4}ms ${MD3_EASING.standard}`,
                                '&:hover': {
                                  bgcolor: surfaceContainer(theme, 'default'),
                                  transform: 'translateX(2px)'
                                }
                              }}
                            >
                              <Checkbox
                                checked={checked}
                                size="small"
                                tabIndex={-1}
                                sx={{ p: 0.25, flexShrink: 0 }}
                                onChange={(event) => {
                                  event.stopPropagation()
                                  handleGroupToggle(group.id, event.target.checked)
                                }}
                              />
                              <ProxyGroupAvatar group={group} size={32} iconSize={18} />
                              <Typography
                                variant="body2"
                                sx={{
                                  flex: 1,
                                  fontWeight: checked ? 600 : 500,
                                  color: checked ? 'text.primary' : 'text.secondary'
                                }}
                              >
                                {group.name}
                              </Typography>
                              {checked && (
                                <CheckCircleOutlinedIcon
                                  sx={{ fontSize: 18, color: 'primary.main', flexShrink: 0 }}
                                />
                              )}
                            </Box>
                          )
                        })}
                      </Stack>
                    )}
                  </Box>
                )}

                {showFavoritesWarning && (
                  <Typography variant="body2" color="warning.main">
                    {t('settings.autoCheckNoFavorites')}
                  </Typography>
                )}

                {showGroupsWarning && !showGroupsEmpty && (
                  <Typography variant="body2" color="warning.main">
                    {t('settings.autoCheckNoGroupsSelected')}
                  </Typography>
                )}
              </Stack>
            </Box>
          </Collapse>
        </Box>

        <Collapse in={enabled} mountOnEnter unmountOnExit>
          <Box sx={{ mt: 0.75, ml: { xs: 1, sm: 2 } }}>
            <SettingsSwitchCard
              icon={<NotificationsOutlinedIcon fontSize="small" />}
              accent="info"
              title={t('settings.autoCheckNotifications')}
              hint={t('settings.autoCheckNotificationsHint')}
              checked={notifications}
              onChange={onNotificationsChange}
              clickable
            />
          </Box>
        </Collapse>
      </Stack>
    </ContentSection>
  )
}

export default SettingsAutoCheckSection
