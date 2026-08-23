import { motion } from 'framer-motion'
import { memo, useCallback } from 'react'
import type { ProxyIconId } from '@shared/types/proxy'
import type { ProxyGroup } from '@shared/types/proxy-group'
import type { ProxyCardViewMode } from '@shared/types/settings'
import {
  listItemTransition,
  listLayoutTransition,
  proxyCardVariants,
  usePrefersReducedMotion
} from '../utils/list-motion'
import { useProxyStore } from '../store/proxyStore'
import DraggableProxyCard from './DraggableProxyCard'
import ProxyCard from './ProxyCard'

interface ProxyListRowProps {
  proxyId: string
  groups: ProxyGroup[]
  variant: ProxyCardViewMode
  dragEnabled: boolean
  draggingProxyId: string | null
  entryAnimationsEnabled: boolean
  listRadius?: string
  onCheck: (proxyId: string) => void
  onEdit: (proxyId: string) => void
  onDelete: (proxyId: string) => void
  onIconChange: (proxyId: string, iconId: ProxyIconId | undefined) => void
  onToggleFavorite: (proxyId: string) => void
  onToggleEnabled: (proxyId: string) => void
  onGroupChange: (proxyId: string, groupId: string | undefined) => void
}

function ProxyListRow({
  proxyId,
  groups,
  variant,
  dragEnabled,
  draggingProxyId,
  entryAnimationsEnabled,
  listRadius,
  onCheck,
  onEdit,
  onDelete,
  onIconChange,
  onToggleFavorite,
  onToggleEnabled,
  onGroupChange
}: ProxyListRowProps): React.JSX.Element | null {
  const proxy = useProxyStore((state) => state.proxiesById.get(proxyId))
  const isChecking = useProxyStore((state) => state.checkingIds.has(proxyId))
  const isCheckingAll = useProxyStore((state) => state.isCheckingAll)
  const reducedMotion = usePrefersReducedMotion()

  const handleCheck = useCallback(() => onCheck(proxyId), [onCheck, proxyId])
  const handleEdit = useCallback(() => onEdit(proxyId), [onEdit, proxyId])
  const handleDelete = useCallback(() => onDelete(proxyId), [onDelete, proxyId])
  const handleIconChange = useCallback(
    (iconId: ProxyIconId | undefined) => onIconChange(proxyId, iconId),
    [onIconChange, proxyId]
  )
  const handleToggleFavorite = useCallback(
    () => onToggleFavorite(proxyId),
    [onToggleFavorite, proxyId]
  )
  const handleToggleEnabled = useCallback(
    () => onToggleEnabled(proxyId),
    [onToggleEnabled, proxyId]
  )
  const handleGroupChange = useCallback(
    (groupId: string | undefined) => onGroupChange(proxyId, groupId),
    [onGroupChange, proxyId]
  )

  if (!proxy) {
    return null
  }

  const isDragging = draggingProxyId === proxyId

  const renderCard = (dragHandle?: React.ReactNode): React.JSX.Element => (
    <ProxyCard
      proxy={proxy}
      groups={groups}
      variant={variant}
      isChecking={isChecking}
      isCheckingAll={isCheckingAll}
      dragHandle={dragHandle}
      listRadius={listRadius}
      onCheck={handleCheck}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onIconChange={handleIconChange}
      onToggleFavorite={handleToggleFavorite}
      onToggleEnabled={handleToggleEnabled}
      onGroupChange={handleGroupChange}
    />
  )

  const renderContent = (dragHandle?: React.ReactNode): React.JSX.Element => {
    const card = renderCard(dragHandle)

    if (reducedMotion) {
      return card
    }

    return (
      <motion.div
        layout={entryAnimationsEnabled && !isDragging}
        variants={proxyCardVariants}
        initial={entryAnimationsEnabled ? 'initial' : false}
        animate="animate"
        exit="exit"
        transition={{ layout: listLayoutTransition, ...listItemTransition }}
        style={{ overflow: 'hidden' }}
      >
        {card}
      </motion.div>
    )
  }

  if (!dragEnabled) {
    return <div>{renderContent()}</div>
  }

  return (
    <DraggableProxyCard id={proxyId} disabled={!dragEnabled}>
      {(dragHandle) => renderContent(dragHandle)}
    </DraggableProxyCard>
  )
}

export default memo(ProxyListRow)
