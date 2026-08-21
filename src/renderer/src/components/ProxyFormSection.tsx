import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Box, Collapse, IconButton, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { type ReactNode, useState } from 'react'
import { MD3_DURATION, MD3_EASING, surfaceContainer } from '../theme'

interface ProxyFormSectionProps {
  icon: ReactNode
  title: string
  description?: string
  children: ReactNode
  collapsible?: boolean
  defaultExpanded?: boolean
  expanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
  listRadius?: string
}

function ProxyFormSection({
  icon,
  title,
  description,
  children,
  collapsible = false,
  defaultExpanded = false,
  expanded,
  onExpandedChange,
  listRadius
}: ProxyFormSectionProps): React.JSX.Element {
  const theme = useTheme()
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded)
  const isControlled = expanded !== undefined
  const isExpanded = isControlled ? expanded : internalExpanded

  const setExpanded = (value: boolean): void => {
    if (!isControlled) {
      setInternalExpanded(value)
    }

    onExpandedChange?.(value)
  }

  const toggleExpanded = (): void => {
    if (!collapsible) return
    setExpanded(!isExpanded)
  }

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: listRadius ?? '16px',
        bgcolor: surfaceContainer(theme, 'low')
      }}
    >
      <Stack
        direction="row"
        spacing={1.25}
        onClick={collapsible ? toggleExpanded : undefined}
        sx={{
          alignItems: 'flex-start',
          mb: !collapsible || isExpanded ? 2 : 0,
          cursor: collapsible ? 'pointer' : 'default',
          userSelect: collapsible ? 'none' : 'auto'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: '12px',
            flexShrink: 0,
            bgcolor: surfaceContainer(theme, 'high'),
            color: 'primary.main'
          }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0, pt: 0.125, flex: 1 }}>
          <Typography variant="subtitle2" sx={{ lineHeight: 1.3 }}>
            {title}
          </Typography>
          {description ? (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 0.25 }}
            >
              {description}
            </Typography>
          ) : null}
        </Box>
        {collapsible ? (
          <IconButton
            size="small"
            onMouseDown={(event) => {
              event.preventDefault()
            }}
            onClick={(event) => {
              event.stopPropagation()
              toggleExpanded()
            }}
            aria-expanded={isExpanded}
            sx={{
              mt: -0.25,
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: `transform ${MD3_DURATION.medium1}ms ${MD3_EASING.emphasizedDecelerate}`
            }}
          >
            <ExpandMoreIcon fontSize="small" />
          </IconButton>
        ) : null}
      </Stack>

      <Collapse in={!collapsible || isExpanded} unmountOnExit>
        <Stack spacing={2}>{children}</Stack>
      </Collapse>
    </Box>
  )
}

export default ProxyFormSection
