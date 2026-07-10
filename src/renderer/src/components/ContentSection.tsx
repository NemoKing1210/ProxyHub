import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Box, Collapse, IconButton, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { type ReactNode, useState } from 'react'
import { elevationShadow, MD3_DURATION, MD3_EASING, surfaceContainer, surfaceTint } from '../theme'

interface ContentSectionProps {
  icon: ReactNode
  title: string
  description?: string
  children: ReactNode
  nested?: boolean
  collapsible?: boolean
  defaultExpanded?: boolean
  expanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
}

function ContentSection({
  icon,
  title,
  description,
  children,
  nested = false,
  collapsible = false,
  defaultExpanded = true,
  expanded,
  onExpandedChange
}: ContentSectionProps): React.JSX.Element {
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
        p: nested ? 2 : { xs: 2.5, sm: 3 },
        borderRadius: nested ? 2.5 : 3,
        bgcolor: surfaceContainer(theme, nested ? 'default' : 'low'),
        border: `1px solid ${surfaceTint(theme, 'primary', 0.14)}`,
        boxShadow: nested ? 'none' : elevationShadow(theme, 1),
        transition: `box-shadow ${MD3_DURATION.short4}ms ${MD3_EASING.standard}, background-color ${MD3_DURATION.short4}ms ${MD3_EASING.standard}`,
        '&:hover': nested
          ? undefined
          : {
              boxShadow: elevationShadow(theme, 2)
            }
      }}
    >
      <Stack
        direction="row"
        spacing={1.5}
        onClick={collapsible ? toggleExpanded : undefined}
        sx={{
          mb: !collapsible || isExpanded ? (description ? 1 : 2) : description ? 1 : 0,
          alignItems: 'flex-start',
          cursor: collapsible ? 'pointer' : 'default',
          userSelect: collapsible ? 'none' : 'auto'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: nested ? 36 : 44,
            height: nested ? 36 : 44,
            borderRadius: 2.5,
            flexShrink: 0,
            bgcolor: surfaceTint(theme),
            color: 'primary.main',
            transition: `transform ${MD3_DURATION.short4}ms ${MD3_EASING.standard}`
          }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0, pt: 0.25, flex: 1 }}>
          <Typography
            variant="h6"
            sx={{
              fontSize: nested ? '0.98rem' : '1.05rem',
              fontWeight: 600,
              lineHeight: 1.3
            }}
          >
            {title}
          </Typography>
          {description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {description}
            </Typography>
          )}
        </Box>
        {collapsible && (
          <IconButton
            size="small"
            onClick={(event) => {
              event.stopPropagation()
              toggleExpanded()
            }}
            aria-expanded={isExpanded}
            sx={{
              mt: 0.25,
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: `transform ${MD3_DURATION.medium1}ms ${MD3_EASING.emphasizedDecelerate}`
            }}
          >
            <ExpandMoreIcon fontSize="small" />
          </IconButton>
        )}
      </Stack>

      <Collapse in={!collapsible || isExpanded} unmountOnExit>
        <Box sx={{ pl: { xs: 0, sm: nested ? 5.5 : 6.5 }, pt: collapsible ? 1.5 : 0 }}>
          {children}
        </Box>
      </Collapse>
    </Box>
  )
}

export default ContentSection
