import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Box, IconButton, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { type ReactNode, useState } from 'react'
import {
  elevationShadow,
  MD3_DURATION,
  MD3_EASING,
  surfaceContainer,
  surfaceTint
} from '../../theme'
import RevealCollapse from '../ui/RevealCollapse'

type ProxyFormSectionAccent = 'primary' | 'error' | 'warning' | 'info'

interface ProxyFormSectionProps {
  icon: ReactNode
  title: string
  description?: string
  children: ReactNode
  collapsible?: boolean
  defaultExpanded?: boolean
  expanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
  accent?: ProxyFormSectionAccent
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
  accent = 'primary',
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
        p: { xs: 2.5, sm: 3 },
        borderRadius: listRadius ?? '16px',
        bgcolor: surfaceContainer(theme, 'low'),
        boxShadow: elevationShadow(theme, 1),
        transition: `box-shadow ${MD3_DURATION.short4}ms ${MD3_EASING.standard}, background-color ${MD3_DURATION.short4}ms ${MD3_EASING.standard}`,
        '&:hover': {
          boxShadow: elevationShadow(theme, 2)
        }
      }}
    >
      <Stack
        direction="row"
        spacing={1.5}
        onClick={collapsible ? toggleExpanded : undefined}
        sx={{
          alignItems: 'flex-start',
          mb: !collapsible || isExpanded ? (description ? 1 : 2) : description ? 1 : 0,
          cursor: collapsible ? 'pointer' : 'default',
          userSelect: collapsible ? 'none' : 'auto'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 44,
            height: 44,
            borderRadius: '16px',
            flexShrink: 0,
            bgcolor: surfaceTint(theme, accent, 0.18),
            color: `${accent}.main`,
            transition: `transform ${MD3_DURATION.short4}ms ${MD3_EASING.standard}`
          }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0, pt: 0.25, flex: 1 }}>
          <Typography
            variant="h6"
            sx={{
              fontSize: '1.05rem',
              fontWeight: 600,
              lineHeight: 1.3,
              color: accent === 'primary' ? 'text.primary' : `${accent}.main`
            }}
          >
            {title}
          </Typography>
          {description ? (
            <Typography variant="body2" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
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

      <RevealCollapse in={!collapsible || isExpanded}>
        <Box
          sx={{
            pl: { xs: 0, sm: 6.5 },
            pt: collapsible ? 1.5 : 0
          }}
        >
          <Stack spacing={2}>{children}</Stack>
        </Box>
      </RevealCollapse>
    </Box>
  )
}

export default ProxyFormSection
