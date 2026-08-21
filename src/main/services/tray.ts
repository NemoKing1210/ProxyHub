import { app, Menu, nativeImage, Tray, type MenuItemConstructorOptions } from 'electron'
import icon from '../../../resources/icon.png?asset'
import {
  formatTrayProxyMenuPrimary,
  formatTrayProxyMenuSecondary
} from '../../shared/utils/tray-proxy-label'
import { getTrayMenuStrings } from '../../shared/i18n/tray-menu'
import { getFavoriteProxies } from '../../shared/utils/favorite-proxies'
import { getProxies, getSettings } from './app-store'
import { openProxyFromTray, showMainWindow } from './main-window'
import {
  checkAllTrayFavorites,
  checkAllTrayProxies,
  checkTrayProxyById,
  isTrayProxyChecking
} from './tray-actions'

let tray: Tray | null = null

function getTrayIcon(): Electron.NativeImage {
  return nativeImage.createFromPath(icon)
}

async function buildTrayContextMenu(): Promise<Menu> {
  const settings = await getSettings()
  const strings = getTrayMenuStrings(settings.language)
  const proxies = await getProxies()
  const favorites = getFavoriteProxies(proxies)
  const enabledCount = proxies.filter((proxy) => proxy.isEnabled !== false).length
  const template: MenuItemConstructorOptions[] = []

  if (favorites.length === 0) {
    template.push({ label: strings.noFavorites, enabled: false })
  } else {
    for (const proxy of favorites) {
      const isChecking = isTrayProxyChecking(proxy.id) || proxy.status === 'checking'

      template.push({
        label: formatTrayProxyMenuPrimary(proxy, strings),
        click: () => {
          void openProxyFromTray(proxy.id)
        }
      })
      template.push({
        label: `    ${formatTrayProxyMenuSecondary(proxy, strings)}`,
        enabled: false
      })
      template.push({
        label: `    ${strings.checkProxy}`,
        enabled: proxy.isEnabled !== false && !isChecking,
        click: () => {
          void checkTrayProxyById(proxy.id)
        }
      })
    }
  }

  template.push(
    { type: 'separator' },
    {
      label: strings.checkAll,
      enabled: enabledCount > 0,
      click: () => {
        void checkAllTrayProxies()
      }
    },
    {
      label: strings.checkAllFavorites,
      enabled: favorites.some((proxy) => proxy.isEnabled !== false),
      click: () => {
        void checkAllTrayFavorites()
      }
    },
    { type: 'separator' },
    {
      label: strings.openApp,
      click: () => {
        showMainWindow()
      }
    },
    {
      label: strings.quit,
      click: () => {
        app.quit()
      }
    }
  )

  return Menu.buildFromTemplate(template)
}

async function showTrayContextMenu(): Promise<void> {
  if (!tray) {
    return
  }

  const menu = await buildTrayContextMenu()
  tray.popUpContextMenu(menu)
}

export function createTray(): Tray {
  if (tray) {
    return tray
  }

  tray = new Tray(getTrayIcon())
  tray.setToolTip('ProxyHub')

  tray.on('click', () => {
    showMainWindow()
  })

  tray.on('right-click', () => {
    void showTrayContextMenu()
  })

  return tray
}

export function destroyTray(): void {
  if (!tray) {
    return
  }

  tray.destroy()
  tray = null
}

export function refreshTrayTooltip(): void {
  if (!tray) {
    return
  }

  void getProxies().then((proxies) => {
    const favorites = getFavoriteProxies(proxies)
    const aliveCount = favorites.filter((proxy) => proxy.status === 'alive').length

    if (favorites.length === 0) {
      tray?.setToolTip('ProxyHub')
      return
    }

    tray?.setToolTip(`ProxyHub · ${aliveCount}/${favorites.length}`)
  })
}

export function getTrayInstance(): Tray | null {
  return tray
}

export async function refreshTrayContextMenu(): Promise<void> {
  if (!tray) {
    return
  }

  const menu = await buildTrayContextMenu()
  tray.setContextMenu(menu)
}
