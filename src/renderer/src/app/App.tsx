import { Route, Routes } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import ProxyList from '../components/ProxyList'
import RoutePersistenceSync from './bootstrap/RoutePersistenceSync'
import SettingsPage from '../pages/SettingsPage'
import AppearancePage from '../pages/settings/AppearancePage'
import AutoCheckPage from '../pages/settings/AutoCheckPage'
import BackupPage from '../pages/settings/BackupPage'
import CheckingPage from '../pages/settings/CheckingPage'
import DangerPage from '../pages/settings/DangerPage'
import AboutPage from '../pages/settings/AboutPage'
import SettingsOverviewPage from '../pages/settings/SettingsOverviewPage'
import SyncPage from '../pages/settings/SyncPage'
import SystemPage from '../pages/settings/SystemPage'

function App(): React.JSX.Element {
  return (
    <>
      <RoutePersistenceSync />
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<ProxyList />} />
          <Route path="settings" element={<SettingsPage />}>
            <Route index element={<SettingsOverviewPage />} />
            <Route path="appearance" element={<AppearancePage />} />
            <Route path="system" element={<SystemPage />} />
            <Route path="auto-check" element={<AutoCheckPage />} />
            <Route path="checking" element={<CheckingPage />} />
            <Route path="backup" element={<BackupPage />} />
            <Route path="sync" element={<SyncPage />} />
            <Route path="danger" element={<DangerPage />} />
            <Route path="about" element={<AboutPage />} />
          </Route>
        </Route>
      </Routes>
    </>
  )
}

export default App
