import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField
} from '@mui/material'
import { useEffect, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import type { Proxy, ProxyProtocol } from '../../../shared/types/proxy'
import { DEFAULT_PORTS } from '../../../shared/types/proxy'
import { createProxyFormSchema, type ProxyFormValues } from '../validation/proxySchema'

interface ProxyFormDialogProps {
  open: boolean
  mode: 'add' | 'edit'
  initialProxy?: Proxy
  onClose: () => void
  onSubmit: (values: ProxyFormValues) => Promise<void>
}

function ProxyFormDialog({
  open,
  mode,
  initialProxy,
  onClose,
  onSubmit
}: ProxyFormDialogProps): React.JSX.Element {
  const { t } = useTranslation()
  const schema = useMemo(() => createProxyFormSchema(t), [t])

  const defaultValues: ProxyFormValues = {
    label: '',
    protocol: 'http',
    host: '',
    port: DEFAULT_PORTS.http,
    username: '',
    password: ''
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

  useEffect(() => {
    if (!open) return

    if (initialProxy) {
      reset({
        label: initialProxy.label ?? '',
        protocol: initialProxy.protocol,
        host: initialProxy.host,
        port: initialProxy.port,
        username: initialProxy.username ?? '',
        password: initialProxy.password ?? ''
      })
      return
    }

    reset(defaultValues)
  }, [open, initialProxy, reset])

  useEffect(() => {
    if (mode === 'add' && open) {
      setValue('port', DEFAULT_PORTS[protocol as ProxyProtocol])
    }
  }, [protocol, mode, open, setValue])

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
        <Stack spacing={2.5} sx={{ mt: 1 }}>
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
              </TextField>
            )}
          />

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
                fullWidth
                required
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

          <Controller
            name="username"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label={t('proxyForm.username')}
                fullWidth
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
                error={Boolean(errors.password)}
                helperText={errors.password?.message}
              />
            )}
          />
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
