import AddIcon from '@mui/icons-material/Add'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import CreateNewFolderOutlinedIcon from '@mui/icons-material/CreateNewFolderOutlined'
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined'
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay'
import StopIcon from '@mui/icons-material/Stop'
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Typography
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent
} from '@dnd-kit/core'
import { snapCenterToCursor } from '@dnd-kit/modifiers'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState, useCallback, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useShallow } from 'zustand/react/shallow'
import type { Proxy, ProxyColorId, ProxyIconId, ProxyInput } from '@shared/types/proxy'
import type { ProxyGroup, ProxyGroupInput } from '@shared/types/proxy-group'
import { DEFAULT_PROXY_COLOR_ID, PROXY_ICON_AUTO_VALUE } from '@shared/types/proxy'
import { normalizeCountryCode } from '@shared/constants/proxy-countries'
import { normalizeAnonymityLevel } from '@shared/utils/proxy-import'
import { normalizeProxyColorId } from '@shared/utils/proxy-colors'
import { parseProxyUrl } from '@shared/utils/proxy-format'
import { filterEnabledProxies } from '@shared/utils/proxy-enabled'
import { useProxyListViewState } from '../../hooks/useProxyListViewState'
import { useGroupStore } from '../../store/groupStore'
import { useProxyStore } from '../../store/proxyStore'
import { useSettingsStore } from '../../store/settingsStore'
import { filterProxies, hasActiveFilters } from '../../lib/filter-proxies'
import { listItemTransition, listLayoutTransition } from '../../lib/list-motion'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { sortProxies, sortProxiesByFavorite } from '../../lib/sort-proxies'
import {
  organizeProxiesByGroup,
  type ProxyGroupSection as OrganizedGroupSection
} from '../../lib/organize-proxies-by-group'
import { getListCardPosition, getListCardRadius } from '../../lib/card-list'
import {
  UNGROUPED_DROP_ZONE_ID,
  getGroupDropZoneId,
  groupsMatch,
  isHoveringGroup,
  resolveDropTargetGroupId
} from '../../lib/proxy-dnd'
import {
  MD3_DURATION,
  MD3_EASING,
  elevationShadow,
  surfaceContainer,
  surfaceTint
} from '../../theme'
import type { ProxyFormValues } from '../../lib/proxy-schema'
import ProxyCardDragOverlay from './ProxyCardDragOverlay'
import ProxyListRow from './ProxyListRow'
import ProxyDeleteConfirmDialog from './ProxyDeleteConfirmDialog'
import ProxyDetailsDialog from './ProxyDetailsDialog'
import ProxyFormDialog from './ProxyFormDialog'
import ProxyGroupClearConfirmDialog from '../group/ProxyGroupClearConfirmDialog'
import ProxyGroupDeleteConfirmDialog from '../group/ProxyGroupDeleteConfirmDialog'
import ProxyGroupDeleteDeadConfirmDialog from '../group/ProxyGroupDeleteDeadConfirmDialog'
import ProxyGroupFormDialog from '../group/ProxyGroupFormDialog'
import ProxyGroupSection from '../group/ProxyGroupSection'
import ProxyStatBadges from './ProxyStatBadges'
import ProxyDropZone from './ProxyDropZone'
import ProxyListFilters from './ProxyListFilters'
import ProxyListSearch from './ProxyListSearch'
import ProxyListSort from './ProxyListSort'
import AutoCheckCountdownBadge from '../check/AutoCheckCountdownBadge'

function toProxyInput(values: ProxyFormValues): ProxyInput {
  return {
    protocol: values.protocol,
    host: values.host.trim(),
    port: values.port,
    label: values.label?.trim() || undefined,
    icon: values.icon === PROXY_ICON_AUTO_VALUE ? undefined : values.icon,
    color: (() => {
      const color = normalizeProxyColorId(values.color)
      return color && color !== DEFAULT_PROXY_COLOR_ID ? color : undefined
    })(),
    username: values.username?.trim() || undefined,
    password: values.password || undefined,
    secret: values.secret?.trim() || undefined,
    countryCode: normalizeCountryCode(values.countryCode),
    city: values.city?.trim() || undefined,
    anonymityLevel: normalizeAnonymityLevel(values.anonymityLevel),
    groupId: values.groupId || undefined
  }
}

interface ProxyGroupSectionEntryProps {
  section: OrganizedGroupSection
  isCheckingAll: boolean
  checkingIds: Set<string>
  dragEnabled: boolean
  draggingProxyId: string | null
  hoveredDropTargetId: string | null
  listRadius?: string
  renderProxyCard: (proxy: Proxy, listRadius?: string) => React.JSX.Element
  onEditGroup: (group: ProxyGroup) => void
  onDeleteGroup: (group: ProxyGroup) => void
  onDeleteDeadGroup: (group: ProxyGroup) => void
  onClearGroup: (group: ProxyGroup) => void
  onIconChange: (group: ProxyGroup, iconId: ProxyIconId | undefined) => void | Promise<void>
  onColorChange: (group: ProxyGroup, colorId: ProxyColorId | undefined) => void | Promise<void>
  onAddProxy: (group: ProxyGroup) => void
  onCheckGroup: (proxies: Proxy[]) => void
}

const ProxyGroupSectionEntry = memo(function ProxyGroupSectionEntry({
  section,
  isCheckingAll,
  checkingIds,
  dragEnabled,
  draggingProxyId,
  hoveredDropTargetId,
  listRadius,
  renderProxyCard,
  onEditGroup,
  onDeleteGroup,
  onDeleteDeadGroup,
  onClearGroup,
  onIconChange,
  onColorChange,
  onAddProxy,
  onCheckGroup
}: ProxyGroupSectionEntryProps): React.JSX.Element {
  const { group, proxies } = section

  const renderProxyItem = useCallback(
    (proxy: Proxy, listRadius?: string): React.JSX.Element => (
      <div key={proxy.id}>{renderProxyCard(proxy, listRadius)}</div>
    ),
    [renderProxyCard]
  )

  return (
    <ProxyGroupSection
      group={group}
      proxies={proxies}
      canCheck={filterEnabledProxies(proxies).length > 0}
      isCheckingAll={isCheckingAll}
      checkingIds={checkingIds}
      dropZoneId={getGroupDropZoneId(group.id)}
      listRadius={listRadius}
      dropZoneDisabled={!dragEnabled}
      isDragActive={Boolean(draggingProxyId)}
      forceExpanded={isHoveringGroup(
        hoveredDropTargetId,
        group.id,
        section.proxies.map((proxy) => proxy.id)
      )}
      onEdit={() => onEditGroup(group)}
      onDelete={() => onDeleteGroup(group)}
      onDeleteDead={() => onDeleteDeadGroup(group)}
      onClear={() => onClearGroup(group)}
      onIconChange={(iconId) => void onIconChange(group, iconId)}
      onColorChange={(colorId) => void onColorChange(group, colorId)}
      onAddProxy={() => onAddProxy(group)}
      onCheck={() => onCheckGroup(proxies)}
      renderProxyItem={renderProxyItem}
    />
  )
})

function ProxyList(): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const reducedMotion = usePrefersReducedMotion()
  const {
    proxies,
    isLoading,
    isCheckingAll,
    checkingIds,
    loadProxies,
    addProxy,
    updateProxy,
    patchProxy,
    toggleFavorite,
    toggleEnabled,
    removeProxy,
    removeProxies,
    checkProxy,
    checkAll,
    cancelCheckAll,
    detailsProxyId,
    setDetailsProxyId
  } = useProxyStore(
    useShallow((state) => ({
      proxies: state.proxies,
      isLoading: state.isLoading,
      isCheckingAll: state.isCheckingAll,
      checkingIds: state.checkingIds,
      loadProxies: state.loadProxies,
      addProxy: state.addProxy,
      updateProxy: state.updateProxy,
      patchProxy: state.patchProxy,
      toggleFavorite: state.toggleFavorite,
      toggleEnabled: state.toggleEnabled,
      removeProxy: state.removeProxy,
      removeProxies: state.removeProxies,
      checkProxy: state.checkProxy,
      checkAll: state.checkAll,
      cancelCheckAll: state.cancelCheckAll,
      detailsProxyId: state.detailsProxyId,
      setDetailsProxyId: state.setDetailsProxyId
    }))
  )
  const {
    groups,
    isLoading: isGroupsLoading,
    loadGroups,
    addGroup,
    updateGroup,
    patchGroup,
    removeGroup
  } = useGroupStore()
  const proxyCardView = useSettingsStore((state) => state.settings.proxyCardView)
  const proxyDragEnabled = useSettingsStore((state) => state.settings.proxyDragEnabled)
  const autoCheckEnabled = useSettingsStore((state) => state.settings.autoCheckEnabled)

  const [addMenuAnchor, setAddMenuAnchor] = useState<HTMLElement | null>(null)
  const [addMenuPosition, setAddMenuPosition] = useState<{ top: number; left: number } | null>(null)
  const [draggingProxyId, setDraggingProxyId] = useState<string | null>(null)
  const [hoveredDropTargetId, setHoveredDropTargetId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add')
  const [editingProxy, setEditingProxy] = useState<Proxy | undefined>()
  const [addProxyGroupId, setAddProxyGroupId] = useState<string | undefined>()

  const [groupDialogOpen, setGroupDialogOpen] = useState(false)
  const [groupDialogMode, setGroupDialogMode] = useState<'add' | 'edit'>('add')
  const [editingGroup, setEditingGroup] = useState<ProxyGroup | undefined>()
  const [deletingGroup, setDeletingGroup] = useState<ProxyGroup | undefined>()
  const [deletingDeadGroup, setDeletingDeadGroup] = useState<ProxyGroup | undefined>()
  const [clearingGroup, setClearingGroup] = useState<ProxyGroup | undefined>()
  const [deletingProxy, setDeletingProxy] = useState<Proxy | undefined>()
  const {
    filters,
    sortField,
    sortDirection,
    setFilters,
    updateFilters,
    setSortField,
    setSortDirection,
    resetFilters
  } = useProxyListViewState()

  useEffect(() => {
    void loadProxies()
    void loadGroups()
  }, [loadProxies, loadGroups])

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent): void => {
      const target = event.target
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return
      }

      const value = event.clipboardData?.getData('text/plain').trim() ?? ''
      const parsed = value ? parseProxyUrl(value) : null
      if (!parsed) {
        return
      }

      event.preventDefault()
      void addProxy(parsed)
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [addProxy])

  const closeAddMenu = useCallback((): void => {
    setAddMenuAnchor(null)
    setAddMenuPosition(null)
  }, [])

  // Контекстное меню на свободных участках страницы — то же, что у кнопки «Добавить».
  // Слушаем window, чтобы покрыть всю область прокрутки страницы (включая пустоту
  // ниже контента и поля вокруг контейнера), а не только высоту контента ProxyList.
  useEffect(() => {
    const handleContextMenu = (event: MouseEvent): void => {
      const target = event.target
      if (!(target instanceof Element)) {
        return
      }

      // Только область страницы под шапкой/навигацией.
      if (!target.closest('[data-app-scroll-container]')) {
        return
      }

      // Не перехватываем правый клик на контролах и текстовых полях.
      if (
        target.closest(
          'input, textarea, button, a, select, [role="button"], [role="menu"], [contenteditable="true"]'
        )
      ) {
        return
      }

      event.preventDefault()
      setAddMenuPosition({ top: event.clientY, left: event.clientX })
    }

    window.addEventListener('contextmenu', handleContextMenu)
    return () => window.removeEventListener('contextmenu', handleContextMenu)
  }, [])

  const openAddDialog = (): void => {
    closeAddMenu()
    setDialogMode('add')
    setEditingProxy(undefined)
    setAddProxyGroupId(undefined)
    setDialogOpen(true)
  }

  const openAddDialogForGroup = useCallback((group: ProxyGroup): void => {
    setDialogMode('add')
    setEditingProxy(undefined)
    setAddProxyGroupId(group.id)
    setDialogOpen(true)
  }, [])

  const openAddGroupDialog = (): void => {
    closeAddMenu()
    setGroupDialogMode('add')
    setEditingGroup(undefined)
    setGroupDialogOpen(true)
  }

  const openEditGroupDialog = useCallback((group: ProxyGroup): void => {
    setGroupDialogMode('edit')
    setEditingGroup(group)
    setGroupDialogOpen(true)
  }, [])

  const openDeleteGroupDialog = useCallback((group: ProxyGroup): void => {
    setDeletingGroup(group)
  }, [])

  const openDeleteDeadGroupDialog = useCallback((group: ProxyGroup): void => {
    setDeletingDeadGroup(group)
  }, [])

  const openClearGroupDialog = useCallback((group: ProxyGroup): void => {
    setClearingGroup(group)
  }, [])

  const openEditDialog = (proxy: Proxy): void => {
    setDialogMode('edit')
    setEditingProxy(proxy)
    setAddProxyGroupId(undefined)
    setDialogOpen(true)
  }

  const openDeleteDialog = (proxy: Proxy): void => {
    setDeletingProxy(proxy)
  }

  const handleGroupSubmit = async (input: ProxyGroupInput): Promise<boolean> => {
    if (groupDialogMode === 'add') {
      const created = await addGroup(input)
      return created !== null
    }

    if (editingGroup) {
      return updateGroup(editingGroup.id, input)
    }

    return false
  }

  const handleGroupIconChange = useCallback(
    async (group: ProxyGroup, iconId: ProxyIconId | undefined): Promise<void> => {
      await patchGroup(group.id, { icon: iconId })
    },
    [patchGroup]
  )

  const handleGroupColorChange = useCallback(
    async (group: ProxyGroup, colorId: ProxyColorId | undefined): Promise<void> => {
      await patchGroup(group.id, { color: colorId })
    },
    [patchGroup]
  )

  const handleCheckGroup = useCallback(
    (groupProxies: Proxy[]): void => {
      void checkAll(filterEnabledProxies(groupProxies).map((proxy) => proxy.id))
    },
    [checkAll]
  )

  const handleGroupDeleteConfirm = async (groupId: string): Promise<void> => {
    await removeGroup(groupId)
  }

  const handleDeleteConfirm = async (proxyId: string): Promise<void> => {
    await removeProxy(proxyId)
  }

  const handleDeleteDeadConfirm = async (groupId: string): Promise<void> => {
    const deadProxyIds = proxies
      .filter((proxy) => proxy.groupId === groupId && proxy.status === 'dead')
      .map((proxy) => proxy.id)

    await removeProxies(deadProxyIds)
  }

  const handleClearGroupConfirm = async (groupId: string): Promise<void> => {
    const groupProxyIds = proxies
      .filter((proxy) => proxy.groupId === groupId)
      .map((proxy) => proxy.id)

    await removeProxies(groupProxyIds)
  }

  const getGroupDeadProxyCount = (groupId: string): number =>
    proxies.filter((proxy) => proxy.groupId === groupId && proxy.status === 'dead').length

  const getGroupProxyCount = (groupId: string): number =>
    proxies.filter((proxy) => proxy.groupId === groupId).length

  const handleSubmit = async (values: ProxyFormValues): Promise<void> => {
    const input = toProxyInput(values)

    if (dialogMode === 'add') {
      await addProxy(input)
      return
    }

    if (editingProxy) {
      await updateProxy(editingProxy.id, input)
    }
  }

  const handleIconChange = useCallback(
    async (proxyId: string, iconId: ProxyIconId | undefined): Promise<void> => {
      await patchProxy(proxyId, { icon: iconId })
    },
    [patchProxy]
  )

  const handleGroupChange = useCallback(
    async (proxyId: string, groupId: string | undefined): Promise<void> => {
      await patchProxy(proxyId, { groupId })
    },
    [patchProxy]
  )

  const handleCheckProxy = useCallback(
    (proxyId: string) => {
      void checkProxy(proxyId)
    },
    [checkProxy]
  )

  const handleEditProxy = useCallback(
    (proxyId: string) => {
      const proxy = proxies.find((item) => item.id === proxyId)
      if (proxy) {
        openEditDialog(proxy)
      }
    },
    [proxies]
  )

  const handleDeleteProxy = useCallback(
    (proxyId: string) => {
      const proxy = proxies.find((item) => item.id === proxyId)
      if (proxy) {
        openDeleteDialog(proxy)
      }
    },
    [proxies]
  )

  const handleToggleFavoriteProxy = useCallback(
    (proxyId: string) => {
      void toggleFavorite(proxyId)
    },
    [toggleFavorite]
  )

  const handleToggleEnabledProxy = useCallback(
    (proxyId: string) => {
      void toggleEnabled(proxyId)
    },
    [toggleEnabled]
  )

  const filteredProxies = useMemo(() => filterProxies(proxies, filters), [proxies, filters])
  const filtersActive = hasActiveFilters(filters)
  const visibleProxies = useMemo(() => {
    const sorted = sortProxies(filteredProxies, sortField, sortDirection)
    return sortProxiesByFavorite(sorted)
  }, [filteredProxies, sortField, sortDirection])
  const organizedList = useMemo(
    () => organizeProxiesByGroup(visibleProxies, groups),
    [visibleProxies, groups]
  )
  const visibleGroupSections = useMemo(() => {
    if (filtersActive) {
      return organizedList.groups.filter((section) => section.proxies.length > 0)
    }

    return organizedList.groups
  }, [organizedList.groups, filtersActive])
  const hasVisibleItems = organizedList.ungrouped.length > 0 || visibleGroupSections.length > 0
  const checkableProxyIds = useMemo(
    () => filterEnabledProxies(visibleProxies).map((proxy) => proxy.id),
    [visibleProxies]
  )
  const isInitialLoading =
    (isLoading || isGroupsLoading) && proxies.length === 0 && groups.length === 0
  const isEmpty = proxies.length === 0 && groups.length === 0
  const dragEnabled = proxyDragEnabled && !isCheckingAll
  const draggingProxy = useMemo(
    () => (draggingProxyId ? proxies.find((proxy) => proxy.id === draggingProxyId) : undefined),
    [draggingProxyId, proxies]
  )
  const showUngroupedDropZone =
    organizedList.ungrouped.length > 0 || (dragEnabled && Boolean(draggingProxyId))

  // Первый рендер данных страницы отдаём без entry/layout-анимаций карточек,
  // чтобы они не конфликтовали с переходом страницы (финальный "рывок").
  // Включаем анимации со следующего кадра — они нужны для изменений списка.
  const [entryAnimationsEnabled, setEntryAnimationsEnabled] = useState(false)

  useEffect(() => {
    if (entryAnimationsEnabled || !hasVisibleItems) {
      return
    }

    const rafId = requestAnimationFrame(() => {
      setEntryAnimationsEnabled(true)
    })
    return () => cancelAnimationFrame(rafId)
  }, [entryAnimationsEnabled, hasVisibleItems])

  const renderProxyCard = useCallback(
    (proxy: Proxy, listRadius?: string): React.JSX.Element => (
      <ProxyListRow
        key={proxy.id}
        proxyId={proxy.id}
        groups={groups}
        variant={proxyCardView}
        dragEnabled={dragEnabled}
        draggingProxyId={draggingProxyId}
        entryAnimationsEnabled={entryAnimationsEnabled}
        listRadius={listRadius}
        onCheck={handleCheckProxy}
        onEdit={handleEditProxy}
        onDelete={handleDeleteProxy}
        onIconChange={handleIconChange}
        onToggleFavorite={handleToggleFavoriteProxy}
        onToggleEnabled={handleToggleEnabledProxy}
        onGroupChange={handleGroupChange}
      />
    ),
    [
      groups,
      proxyCardView,
      dragEnabled,
      draggingProxyId,
      entryAnimationsEnabled,
      handleCheckProxy,
      handleEditProxy,
      handleDeleteProxy,
      handleIconChange,
      handleToggleFavoriteProxy,
      handleToggleEnabledProxy,
      handleGroupChange
    ]
  )

  const ungroupedItems = useMemo(
    () =>
      organizedList.ungrouped.map((proxy, index) => (
        <div key={proxy.id}>
          {renderProxyCard(
            proxy,
            getListCardRadius(getListCardPosition(index, organizedList.ungrouped.length))
          )}
        </div>
      )),
    [organizedList.ungrouped, renderProxyCard]
  )

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }
    })
  )

  const handleDragStart = (event: DragStartEvent): void => {
    if (!dragEnabled) {
      return
    }

    setDraggingProxyId(String(event.active.id))
  }

  const handleDragOver = (event: DragOverEvent): void => {
    setHoveredDropTargetId(event.over ? String(event.over.id) : null)
  }

  const handleDragCancel = (): void => {
    setDraggingProxyId(null)
    setHoveredDropTargetId(null)
  }

  const handleDragEnd = async (event: DragEndEvent): Promise<void> => {
    const activeId = String(event.active.id)
    setDraggingProxyId(null)
    setHoveredDropTargetId(null)

    if (!dragEnabled || !event.over) {
      return
    }

    const proxy = proxies.find((item) => item.id === activeId)
    if (!proxy) {
      return
    }

    const targetGroupId = resolveDropTargetGroupId(event.over.id, proxies, groups)
    if (targetGroupId === null || groupsMatch(proxy.groupId, targetGroupId)) {
      return
    }

    await patchProxy(proxy.id, { groupId: targetGroupId })
  }

  const dragOverlayModifiers = useMemo(() => [snapCenterToCursor], [])

  const detailsProxy = useMemo(
    () => proxies.find((proxy) => proxy.id === detailsProxyId),
    [proxies, detailsProxyId]
  )
  const deletingGroupProxyCount = deletingGroup
    ? proxies.filter((proxy) => proxy.groupId === deletingGroup.id).length
    : 0
  const deletingDeadGroupProxyCount = deletingDeadGroup
    ? getGroupDeadProxyCount(deletingDeadGroup.id)
    : 0
  const clearingGroupProxyCount = clearingGroup ? getGroupProxyCount(clearingGroup.id) : 0

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ mb: 3, alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
      >
        <Box>
          <Typography variant="h5" gutterBottom>
            {t('proxyList.title')}
          </Typography>
          <ProxyStatBadges proxies={proxies} animated sx={{ mt: 0.5 }} />
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant={isCheckingAll ? 'contained' : 'outlined'}
            color={isCheckingAll ? 'error' : 'primary'}
            startIcon={isCheckingAll ? <StopIcon /> : <PlaylistPlayIcon />}
            endIcon={
              !isCheckingAll && autoCheckEnabled ? (
                <AutoCheckCountdownBadge enabled={autoCheckEnabled} embedded />
              ) : undefined
            }
            onClick={() => (isCheckingAll ? cancelCheckAll() : void checkAll(checkableProxyIds))}
            disabled={!isCheckingAll && checkableProxyIds.length === 0}
          >
            {isCheckingAll ? t('proxyList.stopCheckAll') : t('proxyList.checkAll')}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            endIcon={<ArrowDropDownIcon />}
            onClick={(event) => setAddMenuAnchor(event.currentTarget)}
          >
            {t('proxyList.add')}
          </Button>
          <Menu
            anchorEl={addMenuAnchor}
            open={Boolean(addMenuAnchor) || addMenuPosition !== null}
            onClose={closeAddMenu}
            anchorReference={addMenuPosition !== null ? 'anchorPosition' : 'anchorEl'}
            anchorPosition={addMenuPosition ?? undefined}
          >
            <MenuItem onClick={openAddDialog}>
              <ListItemIcon>
                <DnsOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{t('proxyList.addProxy')}</ListItemText>
            </MenuItem>
            <MenuItem onClick={openAddGroupDialog}>
              <ListItemIcon>
                <CreateNewFolderOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{t('proxyList.addGroup')}</ListItemText>
            </MenuItem>
          </Menu>
        </Stack>
      </Stack>

      {isInitialLoading ? (
        <Paper
          sx={{
            py: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            borderRadius: '16px',
            boxShadow: elevationShadow(theme, 1)
          }}
        >
          <CircularProgress size={36} thickness={4} />
          <Typography variant="body2" color="text.secondary">
            {t('proxyList.title')}
          </Typography>
        </Paper>
      ) : isEmpty ? (
        <Paper
          sx={{
            py: 10,
            px: 3,
            textAlign: 'center',
            borderRadius: '16px',
            boxShadow: elevationShadow(theme, 1),
            bgcolor: surfaceContainer(theme, 'low')
          }}
        >
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 64,
              height: 64,
              borderRadius: '16px',
              mb: 2,
              bgcolor: surfaceTint(theme),
              color: 'primary.main'
            }}
          >
            <DnsOutlinedIcon sx={{ fontSize: 32 }} />
          </Box>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
            {t('proxyList.empty')}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            endIcon={<ArrowDropDownIcon />}
            onClick={(event) => setAddMenuAnchor(event.currentTarget)}
            sx={{ mt: 1 }}
          >
            {t('proxyList.add')}
          </Button>
        </Paper>
      ) : (
        <Stack spacing={2}>
          <ProxyListFilters
            proxies={proxies}
            filters={filters}
            shownCount={visibleProxies.length}
            onChange={setFilters}
          />

          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1.5}
            sx={{
              alignItems: 'stretch',
              px: 1.75,
              py: 1.25,
              borderRadius: '16px',
              bgcolor: surfaceContainer(theme, 'low'),
              transition: `background-color ${MD3_DURATION.short4}ms ${MD3_EASING.standard}`,
              '&:focus-within': {
                bgcolor: surfaceContainer(theme, 'default')
              }
            }}
          >
            <ProxyListSearch
              value={filters.searchQuery}
              onChange={(searchQuery) => updateFilters({ searchQuery })}
            />

            <Divider
              orientation="vertical"
              flexItem
              sx={{ display: { xs: 'none', md: 'block' } }}
            />

            <ProxyListSort
              sortField={sortField}
              sortDirection={sortDirection}
              onSortFieldChange={setSortField}
              onSortDirectionChange={setSortDirection}
            />
          </Stack>

          {!hasVisibleItems ? (
            <Paper
              sx={{
                py: 6,
                px: 3,
                textAlign: 'center',
                borderRadius: '16px',
                boxShadow: elevationShadow(theme, 1),
                bgcolor: surfaceContainer(theme, 'low')
              }}
            >
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                {t('proxyList.filters.noResults')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t('proxyList.filters.noResultsHint')}
              </Typography>
              {filtersActive && (
                <Button variant="outlined" onClick={resetFilters}>
                  {t('proxyList.filters.clear')}
                </Button>
              )}
            </Paper>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={pointerWithin}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={(event) => void handleDragEnd(event)}
              onDragCancel={handleDragCancel}
            >
              <Stack spacing={0.75}>
                <AnimatePresence mode="popLayout" initial={false}>
                  {showUngroupedDropZone ? (
                    <motion.div
                      key="ungrouped-drop-zone"
                      layout={!reducedMotion}
                      initial={reducedMotion ? false : 'initial'}
                      animate={reducedMotion ? undefined : 'animate'}
                      exit={reducedMotion ? undefined : 'exit'}
                      transition={
                        reducedMotion
                          ? { duration: 0 }
                          : { layout: listLayoutTransition, ...listItemTransition }
                      }
                    >
                      <ProxyDropZone
                        id={UNGROUPED_DROP_ZONE_ID}
                        disabled={!dragEnabled}
                        isEmpty={organizedList.ungrouped.length === 0}
                        isDragActive={Boolean(draggingProxyId)}
                        emptyLabel={t('proxyList.drag.dropToUngrouped')}
                      >
                        <Stack spacing={0.75}>{ungroupedItems}</Stack>
                      </ProxyDropZone>
                    </motion.div>
                  ) : null}

                  {visibleGroupSections.map((section, index) => (
                    <motion.div
                      key={section.group.id}
                      layout={!reducedMotion}
                      initial={reducedMotion ? false : 'initial'}
                      animate={reducedMotion ? undefined : 'animate'}
                      exit={reducedMotion ? undefined : 'exit'}
                      transition={
                        reducedMotion
                          ? { duration: 0 }
                          : { layout: listLayoutTransition, ...listItemTransition }
                      }
                    >
                      <ProxyGroupSectionEntry
                        section={section}
                        isCheckingAll={isCheckingAll}
                        checkingIds={checkingIds}
                        dragEnabled={dragEnabled}
                        draggingProxyId={draggingProxyId}
                        hoveredDropTargetId={hoveredDropTargetId}
                        listRadius={getListCardRadius(
                          getListCardPosition(index, visibleGroupSections.length)
                        )}
                        renderProxyCard={renderProxyCard}
                        onEditGroup={openEditGroupDialog}
                        onDeleteGroup={openDeleteGroupDialog}
                        onDeleteDeadGroup={openDeleteDeadGroupDialog}
                        onClearGroup={openClearGroupDialog}
                        onIconChange={handleGroupIconChange}
                        onColorChange={handleGroupColorChange}
                        onAddProxy={openAddDialogForGroup}
                        onCheckGroup={handleCheckGroup}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </Stack>

              <DragOverlay
                modifiers={dragOverlayModifiers}
                dropAnimation={
                  reducedMotion
                    ? null
                    : {
                        duration: 220,
                        easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)'
                      }
                }
                style={{ cursor: 'grabbing' }}
              >
                {draggingProxy ? <ProxyCardDragOverlay proxy={draggingProxy} /> : null}
              </DragOverlay>
            </DndContext>
          )}
        </Stack>
      )}

      <ProxyFormDialog
        open={dialogOpen}
        mode={dialogMode}
        initialProxy={editingProxy}
        initialGroupId={addProxyGroupId}

        existingProxies={proxies}
        groups={groups}
        onClose={() => {
          setDialogOpen(false)
          setAddProxyGroupId(undefined)
        }}
        onSubmit={handleSubmit}
      />

      <ProxyGroupFormDialog
        open={groupDialogOpen}
        mode={groupDialogMode}
        initialGroup={editingGroup}
        existingGroups={groups}
        onClose={() => setGroupDialogOpen(false)}
        onSubmit={handleGroupSubmit}
      />

      <ProxyGroupDeleteConfirmDialog
        open={Boolean(deletingGroup)}
        group={deletingGroup}
        proxyCount={deletingGroupProxyCount}
        onClose={() => setDeletingGroup(undefined)}
        onConfirm={handleGroupDeleteConfirm}
      />

      <ProxyGroupDeleteDeadConfirmDialog
        open={Boolean(deletingDeadGroup)}
        group={deletingDeadGroup}
        deadProxyCount={deletingDeadGroupProxyCount}
        onClose={() => setDeletingDeadGroup(undefined)}
        onConfirm={handleDeleteDeadConfirm}
      />

      <ProxyGroupClearConfirmDialog
        open={Boolean(clearingGroup)}
        group={clearingGroup}
        proxyCount={clearingGroupProxyCount}
        onClose={() => setClearingGroup(undefined)}
        onConfirm={handleClearGroupConfirm}
      />

      <ProxyDeleteConfirmDialog
        open={Boolean(deletingProxy)}
        proxy={deletingProxy}
        onClose={() => setDeletingProxy(undefined)}
        onConfirm={handleDeleteConfirm}
      />

      <ProxyDetailsDialog
        open={Boolean(detailsProxy)}
        proxy={detailsProxy}
        isChecking={detailsProxy ? checkingIds.has(detailsProxy.id) : false}
        onClose={() => setDetailsProxyId(null)}
        onCheck={() => {
          if (detailsProxy) {
            void checkProxy(detailsProxy.id)
          }
        }}
      />
    </Box>
  )
}

export default ProxyList
