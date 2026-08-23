import { Box, Pagination, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

interface ProxyGroupPaginationProps {
  page: number
  pageCount: number
  rangeStart: number
  rangeEnd: number
  total: number
  onPageChange: (page: number) => void
}

function ProxyGroupPagination({
  page,
  pageCount,
  rangeStart,
  rangeEnd,
  total,
  onPageChange
}: ProxyGroupPaginationProps): React.JSX.Element {
  const { t } = useTranslation()

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0.75,
        pt: 0.5
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {t('proxyGroup.pageInfo', { start: rangeStart, end: rangeEnd, total })}
      </Typography>

      <Pagination
        count={pageCount}
        page={page}
        onChange={(_event, value) => onPageChange(value)}
        color="primary"
        size="small"
        showFirstButton
        showLastButton
      />
    </Box>
  )
}

export default ProxyGroupPagination
