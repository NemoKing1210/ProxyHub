import { useDroppable } from '@dnd-kit/core'
import { Box, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

interface ProxyDropZoneProps {
  id: string
  children: ReactNode
  disabled?: boolean
  isEmpty?: boolean
  isDragActive?: boolean
  emptyLabel?: string
}

function ProxyDropZone({
  id,
  children,
  disabled = false,
  isEmpty = false,
  isDragActive = false,
  emptyLabel
}: ProxyDropZoneProps): React.JSX.Element {
  const theme = useTheme()
  const { t } = useTranslation()
  const { setNodeRef, isOver } = useDroppable({ id, disabled })

  const showEmptyPlaceholder = isEmpty && isDragActive
  const showHighlight = isOver && !disabled

  return (
    <Box
      ref={setNodeRef}
      sx={{
        borderRadius: 2,
        transition: 'background-color 150ms ease, box-shadow 150ms ease',
        bgcolor: showHighlight ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
        boxShadow: showHighlight
          ? `inset 0 0 0 2px ${alpha(theme.palette.primary.main, 0.5)}`
          : 'none'
      }}
    >
      {showEmptyPlaceholder ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 72,
            px: 2
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            {emptyLabel ?? t('proxyList.drag.dropHere')}
          </Typography>
        </Box>
      ) : (
        children
      )}
    </Box>
  )
}

export default ProxyDropZone
