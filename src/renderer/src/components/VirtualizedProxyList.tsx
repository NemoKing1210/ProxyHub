import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay'
import { Box, Chip, IconButton, Stack, Typography } from '@mui/material'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useMemo, useRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { ProxyIconId } from '../../../shared/types/proxy'
import type { ProxyGroup } from '../../../shared/types/proxy-group'
import type { ProxyCardViewMode } from '../../../shared/types/settings'
import { elevationShadow } from '../theme'
import {
  estimateVirtualItemSize,
  type VirtualProxyListItem
} from '../utils/virtual-proxy-list-items'
import ProxyGroupAvatar from './ProxyGroupAvatar'
import ProxyListRow from './ProxyListRow'

interface VirtualizedProxyListProps {
  items: VirtualProxyListItem[]
  groups: ProxyGroup[]
  proxyCardView: ProxyCardViewMode
  dragEnabled: boolean
  onCheck: (proxyId: string) => void
  onEdit: (proxyId: string) => void
  onDelete: (proxyId: string) => void
  onIconChange: (proxyId: string, iconId: ProxyIconId | undefined) => void
  onToggleFavorite: (proxyId: string) => void
  onToggleEnabled: (proxyId: string) => void
  onGroupChange: (proxyId: string, groupId: string | undefined) => void
  onEditGroup: (group: ProxyGroup) => void
  onCheckGroup: (proxyIds: string[]) => void
  getGroupEnabledProxyIds: (groupId: string) => string[]
  renderMotionWrapper?: (proxyId: string, content: ReactNode) => ReactNode
}

function VirtualGroupHeader({
  group,
  proxyCount,
  deadProxyCount,
  onEdit,
  onCheck,
  canCheck
}: {
  group: ProxyGroup
  proxyCount: number
  deadProxyCount: number
  onEdit: () => void
  onCheck: () => void
  canCheck: boolean
}): React.JSX.Element {
  const { t } = useTranslation()

  return (
    <Box
      sx={{
        px: 1.5,
        py: 1.25,
        borderRadius: 3,
        boxShadow: (theme) => elevationShadow(theme, 1),
        bgcolor: 'background.paper'
      }}
    >
      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
        <Box onClick={onEdit} sx={{ cursor: 'pointer', display: 'flex' }}>
          <ProxyGroupAvatar group={group} size={36} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" noWrap>
            {group.name}
          </Typography>
          <Stack direction="row" spacing={0.75} sx={{ mt: 0.5 }}>
            <Chip size="small" label={t('proxyGroup.proxyCount', { count: proxyCount })} />
            {deadProxyCount > 0 ? (
              <Chip
                size="small"
                color="error"
                variant="outlined"
                label={t('proxyGroup.deleteDeadCount', { count: deadProxyCount })}
              />
            ) : null}
          </Stack>
        </Box>
        <IconButton size="small" disabled={!canCheck} onClick={onCheck}>
          <PlaylistPlayIcon fontSize="small" />
        </IconButton>
      </Stack>
    </Box>
  )
}

function VirtualizedProxyList({
  items,
  groups,
  proxyCardView,
  dragEnabled,
  onCheck,
  onEdit,
  onDelete,
  onIconChange,
  onToggleFavorite,
  onToggleEnabled,
  onGroupChange,
  onEditGroup,
  onCheckGroup,
  getGroupEnabledProxyIds,
  renderMotionWrapper
}: VirtualizedProxyListProps): React.JSX.Element {
  const { t } = useTranslation()
  const parentRef = useRef<HTMLDivElement>(null)
  const estimateSize = useMemo(
    () => (index: number) => estimateVirtualItemSize(items[index], proxyCardView),
    [items, proxyCardView]
  )

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan: 8
  })

  return (
    <Box
      ref={parentRef}
      sx={{
        height: 'min(70vh, 960px)',
        overflow: 'auto',
        pr: 0.5
      }}
    >
      <Box
        sx={{
          height: virtualizer.getTotalSize(),
          width: '100%',
          position: 'relative'
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const item = items[virtualItem.index]

          return (
            <Box
              key={item.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
                pb: item.type === 'proxy' ? 2 : 1,
                pl: item.type === 'proxy' && item.groupId ? 1.5 : 0
              }}
            >
              {item.type === 'ungrouped-empty' ? (
                <Typography variant="body2" color="text.secondary" sx={{ px: 1, py: 1.5 }}>
                  {t('proxyList.drag.dropToUngrouped')}
                </Typography>
              ) : null}

              {item.type === 'group-header' ? (
                <VirtualGroupHeader
                  group={item.group}
                  proxyCount={item.proxyCount}
                  deadProxyCount={item.deadProxyCount}
                  onEdit={() => onEditGroup(item.group)}
                  onCheck={() => onCheckGroup(getGroupEnabledProxyIds(item.group.id))}
                  canCheck={getGroupEnabledProxyIds(item.group.id).length > 0}
                />
              ) : null}

              {item.type === 'proxy' ? (
                <ProxyListRow
                  proxyId={item.proxyId}
                  groups={groups}
                  variant={proxyCardView}
                  dragEnabled={dragEnabled}
                  onCheck={onCheck}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onIconChange={onIconChange}
                  onToggleFavorite={onToggleFavorite}
                  onToggleEnabled={onToggleEnabled}
                  onGroupChange={onGroupChange}
                  motionWrapper={
                    renderMotionWrapper
                      ? (content) => renderMotionWrapper(item.proxyId, content)
                      : undefined
                  }
                />
              ) : null}
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

export default VirtualizedProxyList
