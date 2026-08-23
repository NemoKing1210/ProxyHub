import { Box } from '@mui/material'
import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { usePageScrollRestoration } from '../../hooks/usePageScrollRestoration'
import PersistentOutlet from './PersistentOutlet'

function PageTransition(): React.JSX.Element {
  const location = useLocation()
  const { restoreScroll } = usePageScrollRestoration()

  useLayoutEffect(() => {
    restoreScroll(location.pathname)
  }, [location.pathname, restoreScroll])

  return (
    <Box sx={{ overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
      <PersistentOutlet />
    </Box>
  )
}

export default PageTransition
