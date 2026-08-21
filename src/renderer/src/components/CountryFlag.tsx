import PublicIcon from '@mui/icons-material/Public'
import { Box } from '@mui/material'
import { hasFlag } from 'country-flag-icons'
import * as Flags from 'country-flag-icons/react/3x2'
import { UNKNOWN_COUNTRY_CODE } from '../../../shared/constants/proxy-countries'

interface CountryFlagProps {
  countryCode: string
  size?: number
}

type FlagComponent = (props: React.SVGProps<SVGSVGElement>) => React.JSX.Element

function CountryFlag({ countryCode, size = 20 }: CountryFlagProps): React.JSX.Element {
  const code = countryCode.toUpperCase()
  const height = Math.round(size * 0.75)
  const isUnknown = code === UNKNOWN_COUNTRY_CODE || !hasFlag(code)
  const Flag = !isUnknown
    ? (Flags[code as keyof typeof Flags] as FlagComponent | undefined)
    : undefined

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
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'inset 0 0 0 1px rgba(0, 0, 0, 0.08)'
      }}
    >
      {isUnknown || !Flag ? (
        <PublicIcon sx={{ fontSize: size * 0.65, color: 'text.secondary' }} />
      ) : (
        <Flag style={{ width: size, height, display: 'block' }} />
      )}
    </Box>
  )
}

export default CountryFlag
