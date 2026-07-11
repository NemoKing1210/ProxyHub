import { Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import ProxyList from './components/ProxyList'
import RoutePersistenceSync from './components/RoutePersistenceSync'
import SettingsPage from './pages/SettingsPage'

function App(): React.JSX.Element {
  return (
    <>
      <RoutePersistenceSync />
      <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<ProxyList />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      </Routes>
    </>
  )
}

export default App
