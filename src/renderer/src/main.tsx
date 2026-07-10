import '@fontsource-variable/roboto-flex'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AppProviders from './providers/AppProviders'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders />
  </StrictMode>
)
