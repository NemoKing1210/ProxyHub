import { Box } from '@mui/material'
import CN from 'country-flag-icons/react/3x2/CN'
import DE from 'country-flag-icons/react/3x2/DE'
import ES from 'country-flag-icons/react/3x2/ES'
import FR from 'country-flag-icons/react/3x2/FR'
import IN from 'country-flag-icons/react/3x2/IN'
import JP from 'country-flag-icons/react/3x2/JP'
import PT from 'country-flag-icons/react/3x2/PT'
import RU from 'country-flag-icons/react/3x2/RU'
import SA from 'country-flag-icons/react/3x2/SA'
import UA from 'country-flag-icons/react/3x2/UA'
import US from 'country-flag-icons/react/3x2/US'
import type { AppLanguage } from '@shared/types/settings'

const FLAG_BY_LANGUAGE = {
  en: US,
  zh: CN,
  hi: IN,
  es: ES,
  fr: FR,
  ar: SA,
  pt: PT,
  ru: RU,
  uk: UA,
  ja: JP,
  de: DE
} satisfies Record<AppLanguage, typeof US>

interface LanguageFlagProps {
  language: AppLanguage
  size?: number
}

function LanguageFlag({ language, size = 20 }: LanguageFlagProps): React.JSX.Element {
  const Flag = FLAG_BY_LANGUAGE[language]
  const height = Math.round(size * 0.75)

  return (
    <Box
      aria-hidden
      sx={{
        width: size,
        height,
        borderRadius: '12px',
        flexShrink: 0,
        overflow: 'hidden',
        display: 'inline-flex',
        boxShadow: 'inset 0 0 0 1px rgba(0, 0, 0, 0.08)'
      }}
    >
      <Flag style={{ width: size, height, display: 'block' }} />
    </Box>
  )
}

export default LanguageFlag
