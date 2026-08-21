import CloseIcon from '@mui/icons-material/Close'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import { IconButton, InputAdornment, InputBase, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { MD3_DURATION, MD3_EASING, surfaceContainer } from '../theme'

const SEARCH_DEBOUNCE_MS = 300

interface ProxyListSearchProps {
  value: string
  onChange: (value: string) => void
}

function ProxyListSearch({ value, onChange }: ProxyListSearchProps): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const onChangeRef = useRef(onChange)
  const lastEmittedValueRef = useRef(value)
  const [inputValue, setInputValue] = useState(value)
  const debouncedValue = useDebouncedValue(inputValue, SEARCH_DEBOUNCE_MS)
  const hasValue = Boolean(inputValue.trim())
  const isPending = inputValue !== debouncedValue

  onChangeRef.current = onChange

  useEffect(() => {
    setInputValue(value)
    lastEmittedValueRef.current = value
  }, [value])

  useEffect(() => {
    if (debouncedValue === lastEmittedValueRef.current) {
      return
    }

    lastEmittedValueRef.current = debouncedValue
    onChangeRef.current(debouncedValue)
  }, [debouncedValue])

  const handleClear = (): void => {
    setInputValue('')
    lastEmittedValueRef.current = ''
    onChangeRef.current('')
  }

  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{ alignItems: 'center', flex: 1, minWidth: 0, width: '100%' }}
    >
      <InputBase
        fullWidth
        value={inputValue}
        onChange={(event) => setInputValue(event.target.value)}
        placeholder={t('proxyList.search.placeholder')}
        startAdornment={
          <InputAdornment position="start" sx={{ color: 'text.secondary', mr: 0.25 }}>
            <SearchOutlinedIcon sx={{ fontSize: 20 }} />
          </InputAdornment>
        }
        inputProps={{
          'aria-label': t('proxyList.search.title')
        }}
        sx={{
          px: 1.5,
          py: 0.85,
          borderRadius: '12px',
          fontSize: '0.9rem',
          bgcolor: surfaceContainer(theme, 'high'),
          transition: `background-color ${MD3_DURATION.short4}ms ${MD3_EASING.standard}`,
          '&:hover': {
            bgcolor: surfaceContainer(theme, 'highest')
          },
          '&.Mui-focused': {
            bgcolor: surfaceContainer(theme, 'highest')
          }
        }}
      />
      {isPending ? (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ flexShrink: 0, fontSize: '0.65rem', letterSpacing: '0.04em' }}
        >
          {t('proxyList.search.pending')}
        </Typography>
      ) : null}

      {hasValue ? (
        <IconButton
          size="small"
          onClick={handleClear}
          aria-label={t('proxyList.search.clear')}
          sx={{
            flexShrink: 0,
            bgcolor: surfaceContainer(theme, 'high'),
            transition: `background-color ${MD3_DURATION.short4}ms ${MD3_EASING.standard}`,
            '&:hover': {
              bgcolor: surfaceContainer(theme, 'highest'),
              color: 'primary.main'
            }
          }}
        >
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      ) : null}
    </Stack>
  )
}

export default ProxyListSearch
