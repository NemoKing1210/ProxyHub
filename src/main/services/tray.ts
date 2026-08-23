import { app, Menu, nativeImage, Tray, type MenuItemConstructorOptions } from 'electron'
import icon from '../../../resources/icon.png?asset'
import {
  formatTrayProxyMenuPrimary,
  formatTrayProxyMenuSecondary
} from '@shared/utils/tray-proxy-label'
import { getTrayMenuStrings } from '@shared/i18n/tray-menu'
import { getFavoriteProxies } from '@shared/utils/favorite-proxies'
import { getProxies, getSettings } from './app-store'
import { openProxyFromTray, showMainWindow } from './main-window'
import {
  checkAllTrayFavorites,
  checkAllTrayProxies,
  checkTrayProxyById,
  isTrayProxyChecking
} from './tray-actions'
import { logger } from './logger'

const log = logger.scope('tray')

let tray: Tray | null = null

function getTrayIcon(): Electron.NativeImage {
  return nativeImage.createFromPath(icon)
}

async function buildTrayContextMenu(): Promise<Menu> {
  log.debug('Building tray context menu')
  try {
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
            log.info('Tray open proxy clicked', { proxyId: proxy.id })
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
            log.info('Tray check proxy clicked', { proxyId: proxy.id })
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
          log.info('Tray check all clicked')
          void checkAllTrayProxies()
        }
      },
      {
        label: strings.checkAllFavorites,
        enabled: favorites.some((proxy) => proxy.isEnabled !== false),
        click: () => {
          log.info('Tray check all favorites clicked')
          void checkAllTrayFavorites()
        }
      },
      { type: 'separator' },
      {
        label: strings.openApp,
        click: () => {
          log.info('Tray open app clicked')
          showMainWindow()
        }
      },
      {
        label: strings.quit,
        click: () => {
          log.info('Tray quit clicked')
          app.quit()
        }
      }
    )

    log.debug('Tray context menu built', { favorites: favorites.length, enabledCount })
    return Menu.buildFromTemplate(template)
  } catch (error) {
    log.error('Failed to build tray context menu', error)
    throw error
  }
}

async function showTrayContextMenu(): Promise<void> {
  if (!tray) {
    log.warn('showTrayContextMenu called without tray')
    return
  }

  try {
    log.debug('Showing tray context menu')
    const menu = await buildTrayContextMenu()
    tray.popUpContextMenu(menu)
    log.debug('Tray context menu shown')
  } catch (error) {
    log.error('Failed to show tray context menu', error)
    throw error
  }
}

export function createTray(): Tray {
  if (tray) {
    log.debug('Tray already exists')
    return tray
  }

  log.info('Creating tray')
  tray = new Tray(getTrayIcon())
  tray.setToolTip('ProxyHub')

  tray.on('click', () => {
    log.info('Tray clicked')
    showMainWindow()
  })

  tray.on('right-click', () => {
    log.debug('Tray right-click')
    void showTrayContextMenu()
  })

  log.info('Tray created')
  return tray
}

export function destroyTray(): void {
  if (!tray) {
    log.debug('destroyTray called without tray')
    return
  }

  log.info('Destroying tray')
  try {
    tray.destroy()
  } catch (error) {
    log.error('Failed to destroy tray', error)
  }
  tray = null
  log.info('Tray destroyed')
}

export function refreshTrayTooltip(): void {
  if (!tray) {
    log.debug('refreshTrayTooltip: no tray')
    return
  }

  void getProxies()
    .then((proxies) => {
      const favorites = getFavoriteProxies(proxies)
      const aliveCount = favorites.filter((proxy) => proxy.status === 'alive').length

      if (favorites.length === 0) {
        tray?.setToolTip('ProxyHub')
        log.debug('Tray tooltip refreshed: no favorites')
        return
      }

      tray?.setToolTip(`ProxyHub · ${aliveCount}/${favorites.length}`)
      log.debug('Tray tooltip refreshed', { aliveCount, total: favorites.length })
    })
    .catch((error) => {
      log.error('Failed to refresh tray tooltip', error)
    })
}

export function getTrayInstance(): Tray | null {
  return tray
}

export async function refreshTrayContextMenu(): Promise<void> {
  if (!tray) {
    log.debug('refreshTrayContextMenu: no tray')
    return
  }

  try {
    log.debug('Refreshing tray context menu')
    const menu = await buildTrayContextMenu()
    tray.setContextMenu(menu)
    log.debug('Tray context menu refreshed')
  } catch (error) {
    log.error('Failed to refresh tray context menu', error)
    throw error
  }
}
