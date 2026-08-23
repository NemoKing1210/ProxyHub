import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Box, Collapse, IconButton, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { type ReactNode, useState } from 'react'
import {
  elevationShadow,
  MD3_DURATION,
  MD3_EASING,
  surfaceContainer,
  surfaceTint,
  withThemeAlpha
} from '../theme'

type ContentSectionAccent = 'primary' | 'error' | 'warning' | 'info'

interface ContentSectionProps {
  icon: ReactNode
  title: ReactNode
  description?: string
  children: ReactNode
  nested?: boolean
  collapsible?: boolean
  defaultExpanded?: boolean
  expanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
  accent?: ContentSectionAccent
  showHeader?: boolean
  listRadius?: string
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
  onExpandedChange,
  accent = 'primary',
  showHeader = true,
  listRadius
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

  const accentColor = theme.palette[accent].main
  const accentSurfaceOpacity =
    accent === 'primary' ? undefined : theme.palette.mode === 'dark' ? 0.14 : 0.08

  return (
    <Box
      sx={{
        p: nested ? 2 : { xs: 2.5, sm: 3 },
        borderRadius: listRadius ?? (nested ? '12px' : '16px'),
        bgcolor:
          accent === 'primary'
            ? surfaceContainer(theme, nested ? 'default' : 'low')
            : surfaceTint(theme, accent, accentSurfaceOpacity),
        backgroundImage:
          accent === 'primary'
            ? undefined
            : `linear-gradient(135deg, ${withThemeAlpha(theme, accentColor, theme.palette.mode === 'dark' ? 0.16 : 0.1)} 0%, transparent 58%)`,
        boxShadow:
          accent === 'primary'
            ? elevationShadow(theme, 1)
            : `${elevationShadow(theme, 1)}, inset 0 0 0 1px ${withThemeAlpha(theme, accentColor, 0.28)}`,
        transition: `box-shadow ${MD3_DURATION.short4}ms ${MD3_EASING.standard}, background-color ${MD3_DURATION.short4}ms ${MD3_EASING.standard}`,
        '&:hover': nested
          ? undefined
          : {
              boxShadow:
                accent === 'primary'
                  ? elevationShadow(theme, 2)
                  : `${elevationShadow(theme, 2)}, inset 0 0 0 1px ${withThemeAlpha(theme, accentColor, 0.36)}`
            }
      }}
    >
      {showHeader && (
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
              borderRadius: '16px',
              flexShrink: 0,
              bgcolor: surfaceTint(theme, accent, nested ? 0.14 : 0.18),
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
                fontSize: nested ? '0.98rem' : '1.05rem',
                fontWeight: 600,
                lineHeight: 1.3,
                color: accent === 'primary' ? 'text.primary' : `${accent}.main`
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
              onMouseDown={(event) => {
                event.preventDefault()
              }}
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
      )}

      <Collapse in={!collapsible || isExpanded} mountOnEnter unmountOnExit>
        <Box
          sx={{
            pl: showHeader ? { xs: 0, sm: nested ? 5.5 : 6.5 } : 0,
            pt: showHeader && collapsible ? 1.5 : 0
          }}
        >
          {children}
        </Box>
      </Collapse>
    </Box>
  )
}

export default ContentSection
