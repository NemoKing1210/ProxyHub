import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Box, Collapse, IconButton, Stack, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { type ReactNode, useState } from 'react'

interface ContentSectionProps {
  icon: ReactNode
  title: string
  description?: string
  children: ReactNode
  nested?: boolean
  collapsible?: boolean
  defaultExpanded?: boolean
}

function ContentSection({
  icon,
  title,
  description,
  children,
  nested = false,
  collapsible = false,
  defaultExpanded = true
}: ContentSectionProps): React.JSX.Element {
  const theme = useTheme()
  const [expanded, setExpanded] = useState(defaultExpanded)

  const toggleExpanded = (): void => {
    if (!collapsible) return
    setExpanded((current) => !current)
  }

  return (
    <Box
      sx={{
        p: nested ? 2 : { xs: 2.5, sm: 3 },
        borderRadius: 2.5,
        bgcolor: alpha(
          theme.palette.primary.main,
          nested
            ? theme.palette.mode === 'dark'
              ? 0.1
              : 0.07
            : theme.palette.mode === 'dark'
              ? 0.06
              : 0.04
        )
      }}
    >
      <Stack
        direction="row"
        spacing={1.5}
        onClick={collapsible ? toggleExpanded : undefined}
        sx={{
          mb: !collapsible || expanded ? (description ? 1 : 2) : description ? 1 : 0,
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
            width: nested ? 36 : 40,
            height: nested ? 36 : 40,
            borderRadius: 2,
            flexShrink: 0,
            bgcolor: alpha(theme.palette.primary.main, 0.14),
            color: 'primary.main'
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
            aria-expanded={expanded}
            sx={{
              mt: 0.25,
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }}
          >
            <ExpandMoreIcon fontSize="small" />
          </IconButton>
        )}
      </Stack>

      <Collapse in={!collapsible || expanded} unmountOnExit>
        <Box sx={{ pl: { xs: 0, sm: nested ? 5.5 : 6.5 }, pt: collapsible ? 1.5 : 0 }}>
          {children}
        </Box>
      </Collapse>
    </Box>
  )
}

export default ContentSection
