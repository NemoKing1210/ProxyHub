import { memo, useCallback, type ReactNode } from 'react'
import { useShallow } from 'zustand/react/shallow'
import type { ProxyIconId } from '../../../shared/types/proxy'
import type { ProxyGroup } from '../../../shared/types/proxy-group'
import type { ProxyCardViewMode } from '../../../shared/types/settings'
import { useProxyStore } from '../store/proxyStore'
import DraggableProxyCard from './DraggableProxyCard'
import ProxyCard from './ProxyCard'

interface ProxyListRowProps {
  proxyId: string
  groups: ProxyGroup[]
  variant: ProxyCardViewMode
  dragEnabled: boolean
  onCheck: (proxyId: string) => void
  onEdit: (proxyId: string) => void
  onDelete: (proxyId: string) => void
  onIconChange: (proxyId: string, iconId: ProxyIconId | undefined) => void
  onToggleFavorite: (proxyId: string) => void
  onToggleEnabled: (proxyId: string) => void
  onGroupChange: (proxyId: string, groupId: string | undefined) => void
  motionWrapper?: (content: ReactNode) => ReactNode
}

function ProxyListRow({
  proxyId,
  groups,
  variant,
  dragEnabled,
  onCheck,
  onEdit,
  onDelete,
  onIconChange,
  onToggleFavorite,
  onToggleEnabled,
  onGroupChange,
  motionWrapper
}: ProxyListRowProps): React.JSX.Element | null {
  const { proxy, isChecking, isCheckingAll } = useProxyStore(
    useShallow((state) => {
      const current = state.proxies.find((item) => item.id === proxyId)
      return {
        proxy: current,
        isChecking: state.checkingIds.has(proxyId),
        isCheckingAll: state.isCheckingAll
      }
    })
  )

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

  const renderCard = (dragHandle?: React.ReactNode): React.JSX.Element => {
    const card = (
      <ProxyCard
        proxy={proxy}
        groups={groups}
        variant={variant}
        isChecking={isChecking}
        isCheckingAll={isCheckingAll}
        dragHandle={dragHandle}
        onCheck={handleCheck}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onIconChange={handleIconChange}
        onToggleFavorite={handleToggleFavorite}
        onToggleEnabled={handleToggleEnabled}
        onGroupChange={handleGroupChange}
      />
    )

    return motionWrapper ? <>{motionWrapper(card)}</> : card
  }

  if (!dragEnabled) {
    return <div>{renderCard()}</div>
  }

  return (
    <DraggableProxyCard id={proxyId} disabled={!dragEnabled}>
      {(dragHandle) => renderCard(dragHandle)}
    </DraggableProxyCard>
  )
}

export default memo(ProxyListRow)
