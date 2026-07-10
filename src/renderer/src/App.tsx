import { Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import ProxyList from './components/ProxyList'
import SettingsPage from './pages/SettingsPage'

function App(): React.JSX.Element {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<ProxyList />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}

export default App
