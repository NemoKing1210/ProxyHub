import { Box, Chip, Stack } from '@mui/material'
import { useState } from 'react'

function Versions(): React.JSX.Element {
  const [versions] = useState(window.electron.process.versions)

  return (
    <Box
      component="footer"
      sx={{
        py: 2,
        px: 2,
        borderTop: 1,
        borderColor: 'divider'
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        sx={{ justifyContent: 'center', flexWrap: 'wrap' }}
      >
        <Chip label={`Electron v${versions.electron}`} size="small" variant="outlined" />
        <Chip label={`Chromium v${versions.chrome}`} size="small" variant="outlined" />
        <Chip label={`Node v${versions.node}`} size="small" variant="outlined" />
      </Stack>
    </Box>
  )
}

export default Versions
