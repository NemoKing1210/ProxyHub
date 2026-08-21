import ArrowDownwardOutlinedIcon from '@mui/icons-material/ArrowDownwardOutlined'
import ArrowUpwardOutlinedIcon from '@mui/icons-material/ArrowUpwardOutlined'
import { MenuItem, Stack, TextField, ToggleButton, ToggleButtonGroup } from '@mui/material'
import { useTranslation } from 'react-i18next'
import {
  PROXY_SORT_FIELDS,
  type ProxySortDirection,
  type ProxySortField
} from '../../../shared/types/proxy-list-view'
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

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1}
      sx={{ alignItems: { sm: 'center' }, flexShrink: 0 }}
    >
      <TextField
        select
        label={t('proxyList.sort.fieldLabel')}
        value={sortField}
        onChange={(event) => onSortFieldChange(event.target.value as ProxySortField)}
        size="small"
        sx={{ minWidth: { xs: 0, sm: 180 } }}
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
  )
}

export default ProxyListSort
