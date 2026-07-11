import type { Theme } from '@mui/material/styles'

export function getPalette(theme: {
  vars?: Theme['vars']
  palette: Theme['palette']
}): Theme['palette'] {
  return (theme.vars?.palette ?? theme.palette) as Theme['palette']
}

export function withThemeAlpha(
  theme: { vars?: Theme['vars']; palette: Theme['palette'] },
  color: string,
  value: number | string
): string {
  return (theme as Theme).alpha(color, value)
}
