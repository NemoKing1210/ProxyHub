import { z } from 'zod'
import type { TFunction } from 'i18next'
import { PROXY_ANONYMITY_LEVELS, PROXY_COLOR_IDS, PROXY_ICON_FORM_VALUES } from '../../../shared/types/proxy'

const countryCodePattern = /^[A-Za-z]{2}$/

export function createProxyFormSchema(t: TFunction) {
  return z
    .object({
      label: z.string().trim().max(64, t('validation.labelMax')).optional(),
      icon: z.enum(PROXY_ICON_FORM_VALUES),
      color: z.enum(PROXY_COLOR_IDS),
      protocol: z.enum(['http', 'https', 'socks4', 'socks5']),
      host: z
        .string()
        .trim()
        .min(1, t('validation.hostRequired'))
        .max(253, t('validation.hostTooLong'))
        .refine((value) => {
          if (value === 'localhost') return true

          const isIpv4 =
            /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/.test(value)
          const isHostname =
            /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/.test(
              value
            )

          return isIpv4 || isHostname
        }, t('validation.hostInvalid')),
      port: z
        .number({ error: t('validation.portNumber') })
        .int(t('validation.portInteger'))
        .min(1, t('validation.portMin'))
        .max(65535, t('validation.portMax')),
      username: z.string().trim().max(128, t('validation.usernameMax')).optional(),
      password: z.string().max(128, t('validation.passwordMax')).optional(),
      countryCode: z
        .string()
        .trim()
        .refine((value) => value === '' || countryCodePattern.test(value), t('validation.countryCodeInvalid'))
        .optional(),
      city: z.string().trim().max(64, t('validation.cityMax')).optional(),
      anonymityLevel: z
        .union([z.literal(''), z.enum(PROXY_ANONYMITY_LEVELS)])
        .optional()
    })
    .superRefine((data, ctx) => {
      const hasUsername = Boolean(data.username)
      const hasPassword = Boolean(data.password)

      if (hasUsername !== hasPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('validation.authPair'),
          path: hasUsername ? ['password'] : ['username']
        })
      }
    })
}

export type ProxyFormValues = z.infer<ReturnType<typeof createProxyFormSchema>>

const domainPattern =
  /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/

export function normalizeDomainInput(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .toLowerCase()
}

export function isValidDomain(value: string): boolean {
  const domain = normalizeDomainInput(value)
  return domain === 'localhost' || domainPattern.test(domain)
}

export function validateDomain(value: string, existing: string[], t: TFunction): string | null {
  const domain = normalizeDomainInput(value)

  if (!domain) {
    return t('settings.invalidDomain')
  }

  if (!isValidDomain(domain)) {
    return t('settings.invalidDomain')
  }

  if (existing.includes(domain)) {
    return t('settings.domainDuplicate')
  }

  return null
}
