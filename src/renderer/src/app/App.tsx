import { Route, Routes } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import ProxyList from '../components/proxy/ProxyList'
import RoutePersistenceSync from './bootstrap/RoutePersistenceSync'
import SettingsShell from '../pages/settings/SettingsShell'
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
          {/* Flat settings routes: each screen is a leaf so the transition
              animator caches the whole page without an inner Outlet. */}
          <Route
            path="settings"
            element={
              <SettingsShell>
                <SettingsOverviewPage />
              </SettingsShell>
            }
          />
          <Route
            path="settings/appearance"
            element={
              <SettingsShell>
                <AppearancePage />
              </SettingsShell>
            }
          />
          <Route
            path="settings/system"
            element={
              <SettingsShell>
                <SystemPage />
              </SettingsShell>
            }
          />
          <Route
            path="settings/auto-check"
            element={
              <SettingsShell>
                <AutoCheckPage />
              </SettingsShell>
            }
          />
          <Route
            path="settings/checking"
            element={
              <SettingsShell>
                <CheckingPage />
              </SettingsShell>
            }
          />
          <Route
            path="settings/backup"
            element={
              <SettingsShell>
                <BackupPage />
              </SettingsShell>
            }
          />
          <Route
            path="settings/sync"
            element={
              <SettingsShell>
                <SyncPage />
              </SettingsShell>
            }
          />
          <Route
            path="settings/danger"
            element={
              <SettingsShell>
                <DangerPage />
              </SettingsShell>
            }
          />
          <Route
            path="settings/about"
            element={
              <SettingsShell>
                <AboutPage />
              </SettingsShell>
            }
          />
        </Route>
      </Routes>
    </>
  )
}

export default App
