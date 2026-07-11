import CloseIcon from '@mui/icons-material/Close'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import { Box, IconButton, InputBase, Stack, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import {
  MD3_DURATION,
  MD3_EASING,
  outlineVariant,
  surfaceContainer,
  withThemeAlpha
} from '../theme'

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
    <Box
      sx={{
        flex: 1,
        width: '100%',
        px: 1.75,
        py: 1.5,
        borderRadius: 2.5,
        bgcolor: surfaceContainer(theme, 'low'),
        boxShadow: `inset 0 0 0 1px ${outlineVariant(theme)}`,
        transition: `box-shadow ${MD3_DURATION.short4}ms ${MD3_EASING.standard}, background-color ${MD3_DURATION.short4}ms ${MD3_EASING.standard}`,
        '&:focus-within': {
          bgcolor: surfaceContainer(theme, 'default'),
          boxShadow: `inset 0 0 0 1px ${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.42 : 0.28)}, 0 0 0 3px ${withThemeAlpha(theme, theme.palette.primary.main, 0.12)}`
        }
      }}
    >
      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 1 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: 2,
            flexShrink: 0,
            bgcolor: surfaceContainer(theme, 'high'),
            color: 'primary.main'
          }}
        >
          <SearchOutlinedIcon sx={{ fontSize: 18 }} />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="subtitle2" sx={{ lineHeight: 1.3 }}>
            {t('proxyList.search.title')}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
            {t('proxyList.search.hint')}
          </Typography>
        </Box>
        {isPending && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ flexShrink: 0, fontSize: '0.65rem', letterSpacing: '0.04em' }}
          >
            {t('proxyList.search.pending')}
          </Typography>
        )}
      </Stack>

      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <InputBase
          fullWidth
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          placeholder={t('proxyList.search.placeholder')}
          inputProps={{
            'aria-label': t('proxyList.search.title')
          }}
          sx={{
            px: 1.5,
            py: 0.85,
            borderRadius: 2,
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
    </Box>
  )
}

export default ProxyListSearch
