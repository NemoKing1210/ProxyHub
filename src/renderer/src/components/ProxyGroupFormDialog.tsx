import { zodResolver } from '@hookform/resolvers/zod'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import { useEffect, useMemo, useRef } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import {
  GROUP_ICON_FORM_VALUES,
  type GroupIconFormValue,
  type ProxyGroup
} from '@shared/types/proxy-group'
import { PROXY_COLOR_IDS, PROXY_ICON_IDS } from '@shared/types/proxy'
import { findDuplicateGroupName } from '@shared/utils/proxy-group-identity'
import {
  normalizeGroupInput,
  toGroupColorFormValue,
  toGroupIconFormValue
} from '@shared/utils/proxy-group-normalize'
import type { ProxyGroupInput } from '@shared/types/proxy-group'
import ProxyColorSwatch from './ProxyColorSwatch'
import ProxyGroupAvatar from './ProxyGroupAvatar'
import ProxyIcon from './ProxyIcon'

interface ProxyGroupFormDialogProps {
  open: boolean
  mode: 'add' | 'edit'
  initialGroup?: ProxyGroup
  existingGroups: ProxyGroup[]
  onClose: () => void
  onSubmit: (input: ProxyGroupInput) => Promise<boolean>
}

interface GroupFormValues {
  name: string
  icon: GroupIconFormValue
  color: '' | (typeof PROXY_COLOR_IDS)[number]
}

function createGroupFormSchema(
  t: (key: string) => string,
  getExistingGroups: () => ProxyGroup[],
  getEditingGroupId: () => string | undefined
) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, t('proxyGroup.validation.nameRequired'))
      .max(64, t('proxyGroup.validation.nameMax'))
      .refine(
        (value) => !findDuplicateGroupName(value, getExistingGroups(), getEditingGroupId()),
        t('proxyGroup.validation.nameDuplicate')
      ),
    icon: z.enum(GROUP_ICON_FORM_VALUES),
    color: z.union([z.literal(''), z.enum(PROXY_COLOR_IDS)])
  })
}

function ProxyGroupFormDialog({
  open,
  mode,
  initialGroup,
  existingGroups,
  onClose,
  onSubmit
}: ProxyGroupFormDialogProps): React.JSX.Element {
  const { t } = useTranslation()
  const schemaContextRef = useRef({
    existingGroups,
    editingGroupId: initialGroup?.id
  })

  schemaContextRef.current = {
    existingGroups,
    editingGroupId: initialGroup?.id
  }

  const schema = useMemo(
    () =>
      createGroupFormSchema(
        t,
        () => schemaContextRef.current.existingGroups,
        () => schemaContextRef.current.editingGroupId
      ),
    [t]
  )

  const defaultValues: GroupFormValues = {
    name: '',
    icon: '',
    color: ''
  }

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<GroupFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onBlur'
  })

  const previewName = watch('name')
  const previewIcon = watch('icon')
  const previewColor = watch('color')

  useEffect(() => {
    if (!open) return

    reset({
      name: initialGroup?.name ?? '',
      icon: toGroupIconFormValue(initialGroup?.icon) as GroupIconFormValue,
      color: toGroupColorFormValue(initialGroup?.color) as GroupFormValues['color']
    })
  }, [open, initialGroup, reset])

  const submit = handleSubmit(async (values) => {
    const success = await onSubmit(normalizeGroupInput(values))
    if (success) {
      onClose()
    }
  })

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      slotProps={{
        backdrop: {
          sx: { backdropFilter: 'blur(4px)' }
        }
      }}
    >
      <DialogTitle>
        {mode === 'add' ? t('proxyGroup.addTitle') : t('proxyGroup.editTitle')}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <ProxyGroupAvatar
              group={{
                icon: previewIcon ? (previewIcon as (typeof PROXY_ICON_IDS)[number]) : undefined,
                color: previewColor ? (previewColor as (typeof PROXY_COLOR_IDS)[number]) : undefined
              }}
              size={44}
              iconSize={22}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                {previewName.trim() || t('proxyGroup.previewFallback')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('proxyGroup.previewHint')}
              </Typography>
            </Box>
          </Stack>

          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                autoFocus
                label={t('proxyGroup.name')}
                placeholder={t('proxyGroup.namePlaceholder')}
                fullWidth
                required
                error={Boolean(errors.name)}
                helperText={errors.name?.message}
              />
            )}
          />

          <Controller
            name="icon"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                label={t('proxyGroup.icon')}
                fullWidth
                error={Boolean(errors.icon)}
                helperText={errors.icon?.message ?? t('proxyGroup.iconHint')}
                slotProps={{
                  select: {
                    renderValue: (selected) => {
                      const iconValue = String(selected)

                      if (!iconValue) {
                        return t('proxyGroup.defaultIcon')
                      }

                      return (
                        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                          <ProxyIcon
                            iconId={iconValue as (typeof PROXY_ICON_IDS)[number]}
                            fontSize="small"
                          />
                          <span>{t(`proxyIcons.${iconValue}`)}</span>
                        </Stack>
                      )
                    }
                  }
                }}
              >
                <MenuItem value="">{t('proxyGroup.defaultIcon')}</MenuItem>
                {PROXY_ICON_IDS.map((iconId) => (
                  <MenuItem key={iconId} value={iconId}>
                    <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                      <ProxyIcon iconId={iconId} fontSize="small" />
                      <span>{t(`proxyIcons.${iconId}`)}</span>
                    </Stack>
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          <Controller
            name="color"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                label={t('proxyGroup.color')}
                fullWidth
                error={Boolean(errors.color)}
                helperText={errors.color?.message ?? t('proxyGroup.colorHint')}
                slotProps={{
                  select: {
                    renderValue: (selected) => {
                      const colorValue = String(selected)

                      if (!colorValue) {
                        return t('proxyGroup.defaultColor')
                      }

                      return (
                        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                          <ProxyColorSwatch
                            colorId={colorValue as (typeof PROXY_COLOR_IDS)[number]}
                            size={20}
                          />
                          <span>{t(`proxyColors.${colorValue}`)}</span>
                        </Stack>
                      )
                    }
                  }
                }}
              >
                <MenuItem value="">{t('proxyGroup.defaultColor')}</MenuItem>
                {PROXY_COLOR_IDS.map((colorId) => (
                  <MenuItem key={colorId} value={colorId}>
                    <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                      <ProxyColorSwatch colorId={colorId} size={20} />
                      <span>{t(`proxyColors.${colorId}`)}</span>
                    </Stack>
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          {t('common.cancel')}
        </Button>
        <Button variant="contained" onClick={() => void submit()} disabled={isSubmitting}>
          {mode === 'add' ? t('common.add') : t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ProxyGroupFormDialog
