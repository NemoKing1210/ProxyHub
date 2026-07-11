import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import DragHandleIcon from '@mui/icons-material/DragHandle'
import { Box } from '@mui/material'
import { alpha } from '@mui/material/styles'
import type { ReactElement, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

export interface ProxyCardDragHandleProps {
  setActivatorNodeRef: (element: HTMLElement | null) => void
  listeners: DraggableSyntheticListeners | undefined
  attributes: DraggableAttributes
  isDragging: boolean
  disabled?: boolean
}

export function ProxyCardDragHandle({
  setActivatorNodeRef,
  listeners,
  attributes,
  isDragging,
  disabled = false
}: ProxyCardDragHandleProps): React.JSX.Element {
  const { t } = useTranslation()

  return (
    <Box
      ref={setActivatorNodeRef}
      {...listeners}
      {...attributes}
      aria-label={t('proxyList.drag.dragProxy')}
      title={t('proxyList.drag.dragProxy')}
      aria-disabled={disabled}
      onClick={(event) => event.stopPropagation()}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 48,
        height: 28,
        flexShrink: 0,
        borderRadius: 1.5,
        color: 'text.disabled',
        cursor: disabled ? 'default' : isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        outline: 'none',
        opacity: disabled ? 0.45 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
        transition: 'color 150ms ease, background-color 150ms ease',
        '&:hover': disabled
          ? undefined
          : {
              color: 'text.secondary',
              bgcolor: 'action.hover'
            },
        '&:focus-visible': {
          boxShadow: (theme) => `0 0 0 2px ${theme.palette.primary.main}66`
        }
      }}
    >
      <DragHandleIcon sx={{ fontSize: 22 }} />
    </Box>
  )
}

interface DraggableProxyCardProps {
  id: string
  disabled?: boolean
  children: (dragHandle: ReactElement) => ReactNode
}

function DraggableProxyCard({
  id,
  disabled = false,
  children
}: DraggableProxyCardProps): React.JSX.Element {
  const { t } = useTranslation()
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, isDragging } =
    useDraggable({
      id,
      disabled,
      attributes: {
        role: 'button',
        roleDescription: t('proxyList.drag.dragProxy'),
        tabIndex: 0
      }
    })

  const style = {
    transform: isDragging ? undefined : CSS.Translate.toString(transform),
    touchAction: 'none'
  }

  const dragHandle = (
    <ProxyCardDragHandle
      setActivatorNodeRef={setActivatorNodeRef}
      listeners={listeners}
      attributes={attributes}
      isDragging={isDragging}
      disabled={disabled}
    />
  )

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        minWidth: 0,
        borderRadius: 3,
        transition: 'outline-color 180ms ease, background-color 180ms ease',
        ...(isDragging
          ? {
              outline: (theme) => `2px dashed ${alpha(theme.palette.primary.main, 0.34)}`,
              outlineOffset: 2,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
              '& > *': {
                opacity: 0.34,
                filter: 'grayscale(0.15)'
              }
            }
          : undefined)
      }}
    >
      {children(dragHandle)}
    </Box>
  )
}

export default DraggableProxyCard
