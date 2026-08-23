import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import {
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Slider,
  Stack,
  Typography
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type {
  ProxyListImportFormat,
  ProxyListImportPreview,
  ProxyListImportPreviewEntry
} from '@shared/types/proxy-import'
import type { ProxyGroup } from '@shared/types/proxy-group'
import { formatProxyAddress } from '@shared/utils/proxy-format'
import { outlineVariant, surfaceContainer } from '../../../theme'
import { getProxyProtocolStyles } from '../../../lib/proxy-protocol-styles'
import CountryFlag from '../../../components/ui/CountryFlag'

const PAGE_SIZE = 50

function selectFirstImportableEntries(
  entries: ProxyListImportPreviewEntry[],
  limit: number
): Set<string> {
  const selected = new Set<string>()
  let count = 0

  for (const entry of entries) {
    if (entry.isDuplicate) {
      continue
    }

    if (count >= limit) {
      break
    }

    selected.add(entry.id)
    count += 1
  }

  return selected
}

interface CsvImportPreviewDialogProps {
  open: boolean
  format: ProxyListImportFormat
  preview: ProxyListImportPreview | null
  groups: ProxyGroup[]
  onClose: () => void
  onError: (message: string) => void
  onConfirm: (entryIds: string[], groupId?: string) => Promise<void>
}

interface PreviewRowProps {
  label: string
  value: React.ReactNode
}

function PreviewRow({ label, value }: PreviewRowProps): React.JSX.Element {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'minmax(140px, 42%) 1fr' },
        gap: { xs: 0.35, sm: 1.5 },
        py: 0.85
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500, wordBreak: 'break-word' }}>
        {value}
      </Typography>
    </Box>
  )
}

function CsvImportPreviewDialog({
  open,
  format,
  preview,
  groups,
  onClose,
  onError,
  onConfirm
}: CsvImportPreviewDialogProps): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const translationPrefix = `settings.backup.${format}`
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [importLimit, setImportLimit] = useState(1)
  const [groupId, setGroupId] = useState('')
  const [page, setPage] = useState(1)
  const [isImporting, setIsImporting] = useState(false)

  const importableEntries = useMemo(
    () => preview?.entries.filter((entry) => !entry.isDuplicate) ?? [],
    [preview]
  )

  const duplicateCount = useMemo(
    () => preview?.entries.filter((entry) => entry.isDuplicate).length ?? 0,
    [preview]
  )

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil((preview?.entries.length ?? 0) / PAGE_SIZE)),
    [preview?.entries.length]
  )

  const pageEntries = useMemo(() => {
    if (!preview) {
      return []
    }

    const start = (page - 1) * PAGE_SIZE
    return preview.entries.slice(start, start + PAGE_SIZE)
  }, [page, preview])

  useEffect(() => {
    if (!open || !preview) {
      return
    }

    const importable = preview.entries.filter((entry) => !entry.isDuplicate)
    const initialLimit = importable.length > 0 ? importable.length : 0

    setImportLimit(initialLimit)
    setSelectedIds(selectFirstImportableEntries(preview.entries, initialLimit))
    setGroupId('')
    setPage(1)
    setIsImporting(false)
  }, [open, preview?.filePath, preview])

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount)
    }
  }, [page, pageCount])

  const handleClose = (): void => {
    if (isImporting) {
      return
    }

    onClose()
  }

  const handleToggleEntry = (entry: ProxyListImportPreviewEntry, checked: boolean): void => {
    if (entry.isDuplicate) {
      return
    }

    const next = new Set(selectedIds)

    if (checked) {
      next.add(entry.id)
    } else {
      next.delete(entry.id)
    }

    setSelectedIds(next)

    const selectedImportableCount = importableEntries.filter((item) => next.has(item.id)).length
    setImportLimit(selectedImportableCount > 0 ? selectedImportableCount : 0)
  }

  const handleImportLimitChange = (_event: Event, value: number | number[]): void => {
    if (!preview) {
      return
    }

    const limit = Array.isArray(value) ? value[0] : value
    setImportLimit(limit)
    setSelectedIds(selectFirstImportableEntries(preview.entries, limit))
  }

  const handleTogglePage = (checked: boolean): void => {
    const next = new Set(selectedIds)
    const pageImportable = pageEntries.filter((entry) => !entry.isDuplicate)

    for (const entry of pageImportable) {
      if (checked) {
        next.add(entry.id)
      } else {
        next.delete(entry.id)
      }
    }

    setSelectedIds(next)

    const selectedImportableCount = importableEntries.filter((item) => next.has(item.id)).length
    setImportLimit(selectedImportableCount > 0 ? selectedImportableCount : 0)
  }

  const handleSelectAllImportable = (): void => {
    if (!preview) {
      return
    }

    setImportLimit(importableEntries.length)
    setSelectedIds(selectFirstImportableEntries(preview.entries, importableEntries.length))
  }

  const handleClearSelection = (): void => {
    if (!preview || importableEntries.length === 0) {
      setImportLimit(0)
      setSelectedIds(new Set())
      return
    }

    setImportLimit(1)
    setSelectedIds(selectFirstImportableEntries(preview.entries, 1))
  }

  const handleConfirm = async (): Promise<void> => {
    if (!preview || isImporting || selectedIds.size === 0) {
      return
    }

    setIsImporting(true)

    try {
      await onConfirm([...selectedIds], groupId || undefined)
      onClose()
    } catch {
      onError(
        t(`${translationPrefix}.importError`, { message: t(`${translationPrefix}.errors.unknown`) })
      )
    } finally {
      setIsImporting(false)
    }
  }

  const pageImportable = pageEntries.filter((entry) => !entry.isDuplicate)
  const selectedOnPage = pageImportable.filter((entry) => selectedIds.has(entry.id)).length
  const allPageSelected = pageImportable.length > 0 && selectedOnPage === pageImportable.length
  const somePageSelected = selectedOnPage > 0 && !allPageSelected

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      slotProps={{
        backdrop: {
          sx: { backdropFilter: 'blur(4px)' }
        }
      }}
    >
      <DialogTitle>{t(`${translationPrefix}.previewTitle`)}</DialogTitle>

      <DialogContent>
        {preview && (
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              {t(`${translationPrefix}.previewDescription`)}
            </Typography>

            <Box
              sx={{
                px: 1.75,
                py: 0.5,
                borderRadius: '16px',
                bgcolor: surfaceContainer(theme, 'low'),
                boxShadow: `inset 0 0 0 1px ${outlineVariant(theme)}`
              }}
            >
              <PreviewRow label={t('settings.backup.previewFile')} value={preview.fileName} />
              <Divider />
              <PreviewRow
                label={t(`${translationPrefix}.previewValid`)}
                value={preview.entries.length}
              />
              <Divider />
              <PreviewRow
                label={t(`${translationPrefix}.previewInvalid`)}
                value={preview.invalidLineCount}
              />
              <Divider />
              <PreviewRow
                label={t(`${translationPrefix}.previewDuplicates`)}
                value={duplicateCount}
              />
            </Box>

            <FormControl fullWidth size="small">
              <InputLabel id="csv-import-group-label">
                {t(`${translationPrefix}.importGroup`)}
              </InputLabel>
              <Select
                labelId="csv-import-group-label"
                value={groupId}
                label={t(`${translationPrefix}.importGroup`)}
                onChange={(event) => setGroupId(event.target.value)}
                disabled={isImporting}
              >
                <MenuItem value="">{t(`${translationPrefix}.importGroupNone`)}</MenuItem>
                {groups.map((group) => (
                  <MenuItem key={group.id} value={group.id}>
                    {group.name}
                  </MenuItem>
                ))}
              </Select>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.75, display: 'block' }}
              >
                {t(`${translationPrefix}.importGroupHint`)}
              </Typography>
            </FormControl>

            {importableEntries.length > 0 && (
              <Box>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}
                >
                  <Typography variant="subtitle2">
                    {t('settings.backup.importLimitLabel')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    {t('settings.backup.importLimitValue', {
                      count: importLimit,
                      total: importableEntries.length
                    })}
                  </Typography>
                </Stack>
                <Slider
                  value={importLimit}
                  min={1}
                  max={importableEntries.length}
                  step={1}
                  disabled={isImporting || importableEntries.length <= 1}
                  onChange={handleImportLimitChange}
                  valueLabelDisplay="auto"
                  aria-label={t('settings.backup.importLimitLabel')}
                  sx={{ mt: 0.5, mb: 0.25 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {t('settings.backup.importLimitHint')}
                </Typography>
              </Box>
            )}

            <Box>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', mb: 1.25 }}
              >
                <Typography variant="subtitle2">
                  {t(`${translationPrefix}.importSelectProxies`)}
                </Typography>
                <Chip
                  label={t('settings.backup.exportSelectSelected', {
                    selected: selectedIds.size,
                    total: importableEntries.length
                  })}
                  size="small"
                  color={selectedIds.size > 0 ? 'primary' : 'default'}
                  sx={{ fontWeight: 700, alignSelf: { xs: 'flex-start', sm: 'center' } }}
                />
              </Stack>

              <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap', mb: 1.25 }}>
                <Button
                  size="small"
                  onClick={handleSelectAllImportable}
                  disabled={isImporting || importableEntries.length === 0}
                >
                  {t('settings.backup.exportSelectAll')}
                </Button>
                <Button
                  size="small"
                  onClick={handleClearSelection}
                  disabled={isImporting || selectedIds.size === 0}
                >
                  {t('settings.backup.exportSelectNone')}
                </Button>
              </Stack>

              <Box
                sx={{
                  borderRadius: '16px',
                  bgcolor: surfaceContainer(theme, 'low'),
                  boxShadow: `inset 0 0 0 1px ${outlineVariant(theme)}`,
                  overflow: 'hidden'
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 1.5,
                    py: 1,
                    borderBottom: `1px solid ${outlineVariant(theme)}`
                  }}
                >
                  <Checkbox
                    checked={allPageSelected}
                    indeterminate={somePageSelected}
                    size="small"
                    disabled={isImporting || pageImportable.length === 0}
                    onChange={(event) => handleTogglePage(event.target.checked)}
                    sx={{ p: 0.25 }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
                    {t(`${translationPrefix}.pageSelection`, {
                      selected: selectedOnPage,
                      total: pageImportable.length
                    })}
                  </Typography>
                  {pageCount > 1 && (
                    <Typography variant="caption" color="text.secondary">
                      {t(`${translationPrefix}.pageInfo`, { page, total: pageCount })}
                    </Typography>
                  )}
                </Box>

                <Stack spacing={0} sx={{ maxHeight: 360, overflowY: 'auto' }}>
                  {pageEntries.map((entry) => {
                    const checked = selectedIds.has(entry.id)
                    const protocolStyles = getProxyProtocolStyles(theme, entry.protocol)
                    const address = formatProxyAddress(entry)

                    return (
                      <Box
                        key={entry.id}
                        onClick={() =>
                          !isImporting && !entry.isDuplicate && handleToggleEntry(entry, !checked)
                        }
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.25,
                          px: 1.5,
                          py: 1.05,
                          borderBottom: `1px solid ${outlineVariant(theme)}`,
                          cursor: entry.isDuplicate || isImporting ? 'default' : 'pointer',
                          bgcolor: entry.isDuplicate
                            ? 'action.hover'
                            : checked
                              ? surfaceContainer(theme, 'high')
                              : 'transparent',
                          opacity: entry.isDuplicate ? 0.55 : 1,
                          '&:last-of-type': { borderBottom: 'none' }
                        }}
                      >
                        <Checkbox
                          checked={checked}
                          size="small"
                          tabIndex={-1}
                          disabled={isImporting || entry.isDuplicate}
                          sx={{ p: 0.25, flexShrink: 0 }}
                          onChange={(event) => {
                            event.stopPropagation()
                            handleToggleEntry(entry, event.target.checked)
                          }}
                        />
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: checked ? 600 : 500,
                              fontFamily: 'monospace',
                              fontSize: '0.82rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {address}
                          </Typography>
                          {(entry.countryCode || entry.city || entry.anonymityLevel) && (
                            <Stack
                              direction="row"
                              spacing={0.75}
                              sx={{ alignItems: 'center', mt: 0.25 }}
                            >
                              {entry.countryCode && (
                                <CountryFlag countryCode={entry.countryCode} size={14} />
                              )}
                              <Typography variant="caption" color="text.secondary">
                                {[entry.countryCode, entry.city, entry.anonymityLevel]
                                  .filter(Boolean)
                                  .join(' · ')}
                              </Typography>
                            </Stack>
                          )}
                        </Box>
                        {entry.isDuplicate ? (
                          <Chip
                            label={t(`${translationPrefix}.duplicate`)}
                            size="small"
                            sx={{ height: 22, fontSize: '0.68rem', flexShrink: 0 }}
                          />
                        ) : (
                          <Chip
                            label={entry.protocol.toUpperCase()}
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              bgcolor: protocolStyles.background,
                              color: protocolStyles.main,
                              flexShrink: 0
                            }}
                          />
                        )}
                        {checked && !entry.isDuplicate && (
                          <CheckCircleOutlinedIcon
                            sx={{ fontSize: 18, color: 'primary.main', flexShrink: 0 }}
                          />
                        )}
                      </Box>
                    )
                  })}
                </Stack>
              </Box>

              {pageCount > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1.5 }}>
                  <Pagination
                    count={pageCount}
                    page={page}
                    onChange={(_event, value) => setPage(value)}
                    color="primary"
                    size="small"
                    disabled={isImporting}
                    showFirstButton
                    showLastButton
                  />
                </Box>
              )}
            </Box>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={handleClose} disabled={isImporting}>
          {t('common.cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={() => void handleConfirm()}
          disabled={!preview || isImporting || selectedIds.size === 0}
          startIcon={isImporting ? <CircularProgress size={18} color="inherit" /> : undefined}
        >
          {t(`${translationPrefix}.previewConfirm`)}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CsvImportPreviewDialog
