import { zodResolver } from '@hookform/resolvers/zod'
import FmdGoodOutlinedIcon from '@mui/icons-material/FmdGoodOutlined'
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined'
import LanOutlinedIcon from '@mui/icons-material/LanOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined'
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
import { useTheme } from '@mui/material/styles'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { findProxyCountry, PROXY_COUNTRIES } from '../../../shared/constants/proxy-countries'
import type { Proxy, ProxyProtocol } from '../../../shared/types/proxy'
import type { ProxyGroup } from '../../../shared/types/proxy-group'
import {
  DEFAULT_PORTS,
  DEFAULT_PROXY_COLOR_ID,
  PROXY_ANONYMITY_LEVELS,
  PROXY_COLOR_IDS,
  PROXY_ICON_AUTO_VALUE,
  PROXY_ICON_IDS
} from '../../../shared/types/proxy'
import { resolveProxyColorId } from '../../../shared/utils/proxy-colors'
import { parseProxyUrl } from '../../../shared/utils/proxy-format'
import { getProxyColorStyles } from '../utils/proxy-color-styles'
import {
  createProxyFormSchema,
  type ProxyFormSchemaContext,
  type ProxyFormValues
} from '../validation/proxySchema'
import CountryFlag from './CountryFlag'
import ProxyCardAvatar from './ProxyCardAvatar'
import ProxyColorSwatch from './ProxyColorSwatch'
import ProxyFormSection from './ProxyFormSection'
import ProxyQuickFillPanel from './ProxyQuickFillPanel'
import ProxyIcon from './ProxyIcon'

interface ProxyFormDialogProps {
  open: boolean
  mode: 'add' | 'edit'
  initialProxy?: Proxy
  initialGroupId?: string
  existingProxies: Proxy[]
  groups: ProxyGroup[]
  onClose: () => void
  onSubmit: (values: ProxyFormValues) => Promise<void>
}

function ProxyFormDialog({
  open,
  mode,
  initialProxy,
  initialGroupId,
  existingProxies,
  groups,
  onClose,
  onSubmit
}: ProxyFormDialogProps): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const schemaContextRef = useRef<ProxyFormSchemaContext>({
    existingProxies,
    editingProxyId: initialProxy?.id,
    groups
  })

  schemaContextRef.current = {
    existingProxies,
    editingProxyId: initialProxy?.id,
    groups
  }

  const schema = useMemo(() => createProxyFormSchema(t, () => schemaContextRef.current), [t])

  const defaultValues: ProxyFormValues = {
    label: '',
    icon: PROXY_ICON_AUTO_VALUE,
    color: DEFAULT_PROXY_COLOR_ID,
    protocol: 'http',
    host: '',
    port: DEFAULT_PORTS.http,
    username: '',
    password: '',
    secret: '',
    countryCode: '',
    city: '',
    anonymityLevel: '',
    groupId: ''
  }

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<ProxyFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onBlur'
  })

  const protocol = watch('protocol')
  const isMtproto = protocol === 'mtproto'
  const previewIcon = watch('icon')
  const previewColor = watch('color')
  const previewLabel = watch('label')
  const previewHost = watch('host')
  const previewCountryCode = watch('countryCode')
  const previewColorStyles = useMemo(
    () => getProxyColorStyles(theme, previewColor),
    [theme, previewColor]
  )
  const previewIconValue = previewIcon === PROXY_ICON_AUTO_VALUE ? undefined : previewIcon
  const [appearanceExpanded, setAppearanceExpanded] = useState(false)
  const [connectionExpanded, setConnectionExpanded] = useState(true)
  const [authExpanded, setAuthExpanded] = useState(false)
  const [locationExpanded, setLocationExpanded] = useState(false)
  const [groupExpanded, setGroupExpanded] = useState(false)
  const [quickFillValue, setQuickFillValue] = useState('')
  const [quickFillError, setQuickFillError] = useState<string | null>(null)
  const skipPortDefaultRef = useRef(false)

  useEffect(() => {
    if (!open) return

    setAppearanceExpanded(false)
    setConnectionExpanded(true)
    setAuthExpanded(false)
    setLocationExpanded(false)
    setGroupExpanded(false)
    setQuickFillValue('')
    setQuickFillError(null)
    skipPortDefaultRef.current = false
  }, [open, initialProxy?.id])

  useEffect(() => {
    if (errors.label || errors.icon || errors.color) {
      setAppearanceExpanded(true)
    }

    if (errors.protocol || errors.host || errors.port) {
      setConnectionExpanded(true)
    }

    if (errors.username || errors.password || errors.secret) {
      setAuthExpanded(true)
    }

    if (errors.countryCode || errors.city || errors.anonymityLevel) {
      setLocationExpanded(true)
    }

    if (errors.groupId) {
      setGroupExpanded(true)
    }
  }, [
    errors.label,
    errors.icon,
    errors.color,
    errors.protocol,
    errors.host,
    errors.port,
    errors.username,
    errors.password,
    errors.secret,
    errors.countryCode,
    errors.city,
    errors.anonymityLevel,
    errors.groupId
  ])

  useEffect(() => {
    if (!open) return

    if (initialProxy) {
      reset({
        label: initialProxy.label ?? '',
        icon: initialProxy.icon ?? PROXY_ICON_AUTO_VALUE,
        color: initialProxy.color ?? DEFAULT_PROXY_COLOR_ID,
        protocol: initialProxy.protocol,
        host: initialProxy.host,
        port: initialProxy.port,
        username: initialProxy.username ?? '',
        password: initialProxy.password ?? '',
        secret: initialProxy.secret ?? '',
        countryCode: initialProxy.countryCode ?? '',
        city: initialProxy.city ?? '',
        anonymityLevel: initialProxy.anonymityLevel ?? '',
        groupId: initialProxy.groupId ?? ''
      })
      return
    }

    reset({
      ...defaultValues,
      groupId: initialGroupId ?? ''
    })
    if (initialGroupId) {
      setGroupExpanded(true)
    }
  }, [open, initialProxy, initialGroupId, reset])

  useEffect(() => {
    if (mode === 'add' && open) {
      if (skipPortDefaultRef.current) {
        skipPortDefaultRef.current = false
        return
      }

      setValue('port', DEFAULT_PORTS[protocol as ProxyProtocol])
    }
  }, [protocol, mode, open, setValue])

  useEffect(() => {
    if (!open) return

    if (isMtproto) {
      setValue('username', '')
      setValue('password', '')
      return
    }

    setValue('secret', '')
  }, [isMtproto, open, setValue])

  const applyQuickFill = useCallback(() => {
    const parsed = parseProxyUrl(quickFillValue)

    if (!parsed) {
      setQuickFillError(t('proxyForm.quickFillError'))
      return
    }

    skipPortDefaultRef.current = true
    setValue('protocol', parsed.protocol)
    setValue('host', parsed.host)
    setValue('port', parsed.port)
    setValue('username', parsed.username ?? '')
    setValue('password', parsed.password ?? '')
    setValue('secret', parsed.secret ?? '')

    if (parsed.secret) {
      setAuthExpanded(true)
    } else if (parsed.username || parsed.password) {
      setAuthExpanded(true)
    }

    setQuickFillError(null)
    setQuickFillValue('')
  }, [quickFillValue, setValue, t])

  const submit = handleSubmit(async (values) => {
    await onSubmit(values)
    onClose()
  })

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        backdrop: {
          sx: { backdropFilter: 'blur(4px)' }
        }
      }}
    >
      <DialogTitle>
        {mode === 'add' ? t('proxyForm.addTitle') : t('proxyForm.editTitle')}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <ProxyFormSection
            icon={<LanOutlinedIcon sx={{ fontSize: 18 }} />}
            title={t('proxyForm.sections.connection')}
            description={t('proxyForm.sections.connectionDescription')}
            collapsible
            expanded={connectionExpanded}
            onExpandedChange={setConnectionExpanded}
          >
            {mode === 'add' ? (
              <ProxyQuickFillPanel
                value={quickFillValue}
                error={quickFillError}
                onChange={(nextValue) => {
                  setQuickFillValue(nextValue)
                  if (quickFillError) {
                    setQuickFillError(null)
                  }
                }}
                onApply={applyQuickFill}
              />
            ) : null}

            <Controller
              name="protocol"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label={t('proxyForm.protocol')}
                  fullWidth
                  error={Boolean(errors.protocol)}
                  helperText={errors.protocol?.message}
                >
                  <MenuItem value="http">HTTP</MenuItem>
                  <MenuItem value="https">HTTPS</MenuItem>
                  <MenuItem value="socks4">SOCKS4</MenuItem>
                  <MenuItem value="socks5">SOCKS5</MenuItem>
                  <MenuItem value="mtproto">MTProto</MenuItem>
                </TextField>
              )}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Controller
                name="host"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t('proxyForm.host')}
                    placeholder={t('proxyForm.hostPlaceholder')}
                    fullWidth
                    required
                    sx={{ flex: 1 }}
                    error={Boolean(errors.host)}
                    helperText={errors.host?.message}
                  />
                )}
              />

              <Controller
                name="port"
                control={control}
                render={({ field }) => (
                  <TextField
                    label={t('proxyForm.port')}
                    type="number"
                    required
                    sx={{ width: { xs: '100%', sm: 140 } }}
                    value={field.value}
                    onChange={(event) => field.onChange(Number(event.target.value))}
                    onBlur={field.onBlur}
                    name={field.name}
                    inputRef={field.ref}
                    error={Boolean(errors.port)}
                    helperText={errors.port?.message}
                  />
                )}
              />
            </Stack>
          </ProxyFormSection>

          <ProxyFormSection
            icon={<LockOutlinedIcon sx={{ fontSize: 18 }} />}
            title={
              isMtproto
                ? t('proxyForm.sections.mtprotoAuthentication')
                : t('proxyForm.sections.authentication')
            }
            description={
              isMtproto
                ? t('proxyForm.sections.mtprotoAuthenticationDescription')
                : t('proxyForm.sections.authenticationDescription')
            }
            collapsible
            expanded={authExpanded}
            onExpandedChange={setAuthExpanded}
          >
            {isMtproto ? (
              <Controller
                name="secret"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t('proxyForm.secret')}
                    placeholder={t('proxyForm.secretPlaceholder')}
                    fullWidth
                    required
                    error={Boolean(errors.secret)}
                    helperText={errors.secret?.message ?? t('proxyForm.secretHint')}
                    slotProps={{
                      input: {
                        sx: { fontFamily: 'monospace', fontSize: '0.84rem' }
                      }
                    }}
                  />
                )}
              />
            ) : (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Controller
                  name="username"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={t('proxyForm.username')}
                      fullWidth
                      sx={{ flex: 1 }}
                      error={Boolean(errors.username)}
                      helperText={errors.username?.message}
                    />
                  )}
                />

                <Controller
                  name="password"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={t('proxyForm.password')}
                      type="password"
                      fullWidth
                      sx={{ flex: 1 }}
                      error={Boolean(errors.password)}
                      helperText={errors.password?.message}
                    />
                  )}
                />
              </Stack>
            )}
          </ProxyFormSection>

          <ProxyFormSection
            icon={<FmdGoodOutlinedIcon sx={{ fontSize: 18 }} />}
            title={t('proxyForm.sections.location')}
            description={t('proxyForm.sections.locationDescription')}
            collapsible
            expanded={locationExpanded}
            onExpandedChange={setLocationExpanded}
          >
            <Controller
              name="countryCode"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label={t('proxyForm.country')}
                  fullWidth
                  error={Boolean(errors.countryCode)}
                  helperText={errors.countryCode?.message ?? t('proxyForm.countryHint')}
                  slotProps={{
                    select: {
                      renderValue: (selected) => {
                        const code = String(selected)

                        if (!code) {
                          return t('common.none')
                        }

                        const country = findProxyCountry(code)

                        return (
                          <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                            <CountryFlag countryCode={code} />
                            <span>{country ? `${country.name} (${country.code})` : code}</span>
                          </Stack>
                        )
                      }
                    }
                  }}
                >
                  <MenuItem value="">{t('common.none')}</MenuItem>
                  {PROXY_COUNTRIES.map((country) => (
                    <MenuItem key={country.code} value={country.code}>
                      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                        <CountryFlag countryCode={country.code} />
                        <span>
                          {country.name} ({country.code})
                        </span>
                      </Stack>
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Controller
                name="city"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t('proxyForm.city')}
                    placeholder={t('proxyForm.cityPlaceholder')}
                    fullWidth
                    sx={{ flex: 1 }}
                    error={Boolean(errors.city)}
                    helperText={errors.city?.message}
                  />
                )}
              />

              <Controller
                name="anonymityLevel"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label={t('proxyForm.anonymityLevel')}
                    fullWidth
                    sx={{ flex: 1 }}
                    error={Boolean(errors.anonymityLevel)}
                    helperText={errors.anonymityLevel?.message ?? t('proxyForm.anonymityHint')}
                  >
                    <MenuItem value="">{t('common.none')}</MenuItem>
                    {PROXY_ANONYMITY_LEVELS.map((level) => (
                      <MenuItem key={level} value={level}>
                        {t(`proxyAnonymity.${level}`)}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Stack>
          </ProxyFormSection>

          <ProxyFormSection
            icon={<FolderOutlinedIcon sx={{ fontSize: 18 }} />}
            title={t('proxyForm.sections.group')}
            description={t('proxyForm.sections.groupDescription')}
            collapsible
            expanded={groupExpanded}
            onExpandedChange={setGroupExpanded}
          >
            <Controller
              name="groupId"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label={t('proxyForm.group')}
                  fullWidth
                  error={Boolean(errors.groupId)}
                  helperText={errors.groupId?.message ?? t('proxyForm.groupHint')}
                >
                  <MenuItem value="">{t('common.none')}</MenuItem>
                  {groups.map((group) => (
                    <MenuItem key={group.id} value={group.id}>
                      {group.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </ProxyFormSection>

          <ProxyFormSection
            icon={<PaletteOutlinedIcon sx={{ fontSize: 18 }} />}
            title={t('proxyForm.sections.appearance')}
            description={t('proxyForm.sections.appearanceDescription')}
            collapsible
            expanded={appearanceExpanded}
            onExpandedChange={setAppearanceExpanded}
          >
            <Controller
              name="label"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={t('proxyForm.label')}
                  fullWidth
                  error={Boolean(errors.label)}
                  helperText={errors.label?.message}
                />
              )}
            />

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{ alignItems: { sm: 'flex-start' } }}
            >
              <Controller
                name="icon"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label={t('proxyForm.icon')}
                    fullWidth
                    error={Boolean(errors.icon)}
                    helperText={errors.icon?.message ?? t('proxyForm.iconHint')}
                    slotProps={{
                      select: {
                        renderValue: (selected) => {
                          const iconValue = String(selected)

                          if (iconValue === PROXY_ICON_AUTO_VALUE) {
                            return (
                              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                                <ProxyCardAvatar
                                  countryCode={previewCountryCode || undefined}
                                  flagSize={20}
                                  fontSize="small"
                                />
                                <span>{t('proxyIcons.auto')}</span>
                              </Stack>
                            )
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
                    <MenuItem value={PROXY_ICON_AUTO_VALUE}>
                      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                        <ProxyCardAvatar
                          countryCode={previewCountryCode || undefined}
                          flagSize={20}
                          fontSize="small"
                        />
                        <span>{t('proxyIcons.auto')}</span>
                      </Stack>
                    </MenuItem>
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
                    label={t('proxyForm.color')}
                    fullWidth
                    error={Boolean(errors.color)}
                    helperText={errors.color?.message ?? t('proxyForm.colorHint')}
                    slotProps={{
                      select: {
                        renderValue: (selected) => {
                          const colorId = resolveProxyColorId(String(selected))

                          return (
                            <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                              <ProxyColorSwatch colorId={colorId} size={20} />
                              <span>{t(`proxyColors.${colorId}`)}</span>
                            </Stack>
                          )
                        }
                      }
                    }}
                  >
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

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 1.5,
                borderRadius: 2,
                bgcolor: 'background.paper'
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  flexShrink: 0,
                  bgcolor: previewColorStyles.background,
                  color: previewColorStyles.main
                }}
              >
                <ProxyCardAvatar
                  icon={previewIconValue}
                  countryCode={previewCountryCode || undefined}
                  flagSize={22}
                  fontSize="small"
                />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" noWrap>
                  {previewLabel?.trim() || previewHost?.trim() || t('proxyForm.previewFallback')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('proxyForm.previewHint')}
                </Typography>
              </Box>
            </Box>
          </ProxyFormSection>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
        <Button onClick={onClose} disabled={isSubmitting} variant="text">
          {t('common.cancel')}
        </Button>
        <Button variant="contained" onClick={() => void submit()} disabled={isSubmitting}>
          {mode === 'add' ? t('common.add') : t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ProxyFormDialog
