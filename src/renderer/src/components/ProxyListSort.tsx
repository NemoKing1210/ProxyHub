import ArrowDownwardOutlinedIcon from '@mui/icons-material/ArrowDownwardOutlined'
import ArrowUpwardOutlinedIcon from '@mui/icons-material/ArrowUpwardOutlined'
import SortOutlinedIcon from '@mui/icons-material/SortOutlined'
import { Box, MenuItem, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import {
  PROXY_SORT_FIELDS,
  type ProxySortDirection,
  type ProxySortField
} from '../../../shared/types/proxy-list-view'
import { outlineVariant, surfaceContainer } from '../theme'

interface ProxyListSortProps {
  sortField: ProxySortField
  sortDirection: ProxySortDirection
  onSortFieldChange: (field: ProxySortField) => void
  onSortDirectionChange: (direction: ProxySortDirection) => void
}

function ProxyListSort({
  sortField,
  sortDirection,
  onSortFieldChange,
  onSortDirectionChange
}: ProxyListSortProps): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()

  return (
    <Box
      sx={{
        flex: 1,
        width: '100%',
        px: 1.75,
        py: 1.5,
        borderRadius: 2.5,
        bgcolor: surfaceContainer(theme, 'low'),
        boxShadow: `inset 0 0 0 1px ${outlineVariant(theme)}`
      }}
    >
      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 1.25 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: 2,
            flexShrink: 0,
            bgcolor: surfaceContainer(theme, 'high'),
            color: 'primary.main'
          }}
        >
          <SortOutlinedIcon sx={{ fontSize: 18 }} />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="subtitle2" sx={{ lineHeight: 1.3 }}>
            {t('proxyList.sort.title')}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
            {t('proxyList.sort.hint')}
          </Typography>
        </Box>
      </Stack>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        sx={{ alignItems: { sm: 'center' } }}
      >
        <TextField
          select
          label={t('proxyList.sort.fieldLabel')}
          value={sortField}
          onChange={(event) => onSortFieldChange(event.target.value as ProxySortField)}
          fullWidth
          size="small"
          sx={{ flex: 1 }}
        >
          {PROXY_SORT_FIELDS.map((field) => (
            <MenuItem key={field} value={field}>
              {t(`proxyList.sort.fields.${field}`)}
            </MenuItem>
          ))}
        </TextField>

        <ToggleButtonGroup
          value={sortDirection}
          exclusive
          onChange={(_event, value: ProxySortDirection | null) => {
            if (value) {
              onSortDirectionChange(value)
            }
          }}
          aria-label={t('proxyList.sort.directionLabel')}
          sx={{
            flexShrink: 0,
            alignSelf: { xs: 'stretch', sm: 'auto' },
            '& .MuiToggleButton-root': {
              px: 1.5,
              py: 0.85,
              gap: 0.5,
              minWidth: { xs: 0, sm: 112 }
            }
          }}
        >
          <ToggleButton value="asc" aria-label={t('proxyList.sort.asc')}>
            <ArrowUpwardOutlinedIcon fontSize="small" />
            {t('proxyList.sort.asc')}
          </ToggleButton>
          <ToggleButton value="desc" aria-label={t('proxyList.sort.desc')}>
            <ArrowDownwardOutlinedIcon fontSize="small" />
            {t('proxyList.sort.desc')}
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>
    </Box>
  )
}

export default ProxyListSort
