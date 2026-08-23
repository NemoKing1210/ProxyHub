import { execFile } from 'child_process'
import { promisify } from 'util'
import type { Proxy } from '@shared/types/proxy'
import { logger } from './logger'

const log = logger.scope('system-proxy')
const execFileAsync = promisify(execFile)

const REG_PATH = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings'

export interface SystemProxyInfo {
  enabled: boolean
  server: string | null
}

function isWindows(): boolean {
  return process.platform === 'win32'
}

function buildProxyServer(proxy: Proxy): string {
  const hostPort = `${proxy.host}:${proxy.port}`

  switch (proxy.protocol) {
    case 'http':
    case 'https':
      return `http=${hostPort};https=${hostPort}`
    case 'socks4':
    case 'socks5':
      return `socks=${hostPort}`
    case 'mtproto':
      throw new Error('MTProto is not supported as system proxy')
    default:
      return hostPort
  }
}

async function regQueryValue(valueName: string): Promise<string | null> {
  try {
    log.debug('Querying registry value', { valueName })
    const { stdout } = await execFileAsync('reg', ['query', REG_PATH, '/v', valueName], {
      windowsHide: true
    })
    const match = stdout.match(/REG_\w+\s+(.*)/)
    const value = match ? match[1].trim() : null
    log.debug('Registry value result', { valueName, value })
    return value
  } catch (error) {
    log.debug('Registry query failed', {
      valueName,
      error: error instanceof Error ? error.message : String(error)
    })
    return null
  }
}

export async function getSystemProxy(): Promise<SystemProxyInfo> {
  log.debug('getSystemProxy called')
  if (!isWindows()) {
    log.debug('getSystemProxy: not Windows, returning disabled')
    return { enabled: false, server: null }
  }

  try {
    const enableRaw = await regQueryValue('ProxyEnable')
    const serverRaw = await regQueryValue('ProxyServer')

    let enabled = false
    if (enableRaw) {
      const trimmed = enableRaw.trim()
      enabled = trimmed === '0x1' || trimmed === '1'
    }

    const server = serverRaw ? serverRaw.trim() : null
    const info = { enabled, server }
    log.info('System proxy retrieved', info)
    return info
  } catch (error) {
    log.error('Failed to get system proxy', error)
    throw error
  }
}

export async function setSystemProxy(proxy: Proxy): Promise<SystemProxyInfo> {
  log.info('setSystemProxy called', {
    proxyId: proxy.id,
    host: proxy.host,
    port: proxy.port,
    protocol: proxy.protocol
  })
  if (!isWindows()) {
    log.error('setSystemProxy: not Windows')
    throw new Error('System proxy is only supported on Windows')
  }

  const server = buildProxyServer(proxy)
  log.debug('Built proxy server string', { server })

  try {
    await execFileAsync(
      'reg',
      ['add', REG_PATH, '/v', 'ProxyEnable', '/t', 'REG_DWORD', '/d', '1', '/f'],
      {
        windowsHide: true
      }
    )
    log.debug('ProxyEnable set to 1')

    await execFileAsync(
      'reg',
      ['add', REG_PATH, '/v', 'ProxyServer', '/t', 'REG_SZ', '/d', server, '/f'],
      {
        windowsHide: true
      }
    )
    log.debug('ProxyServer set', { server })

    // Ensure ProxyOverride keeps bypass for local addresses
    try {
      const override = await regQueryValue('ProxyOverride')
      if (!override) {
        await execFileAsync(
          'reg',
          ['add', REG_PATH, '/v', 'ProxyOverride', '/t', 'REG_SZ', '/d', '<local>', '/f'],
          { windowsHide: true }
        )
        log.debug('ProxyOverride set to <local>')
      } else {
        log.debug('ProxyOverride already present', { override })
      }
    } catch (error) {
      log.warn('Failed to ensure ProxyOverride', error)
    }

    const result = { enabled: true, server }
    log.info('System proxy set', result)
    return result
  } catch (error) {
    log.error('Failed to set system proxy', error)
    throw error
  }
}

export async function clearSystemProxy(): Promise<SystemProxyInfo> {
  log.info('clearSystemProxy called')
  if (!isWindows()) {
    log.error('clearSystemProxy: not Windows')
    throw new Error('System proxy is only supported on Windows')
  }

  try {
    await execFileAsync(
      'reg',
      ['add', REG_PATH, '/v', 'ProxyEnable', '/t', 'REG_DWORD', '/d', '0', '/f'],
      {
        windowsHide: true
      }
    )

    log.info('System proxy cleared')
    return { enabled: false, server: null }
  } catch (error) {
    log.error('Failed to clear system proxy', error)
    throw error
  }
}

export function isProxyActiveAsSystemProxy(proxy: Proxy, info: SystemProxyInfo | null): boolean {
  if (!info || !info.enabled || !info.server) return false
  const hostPort = `${proxy.host}:${proxy.port}`
  return info.server.includes(hostPort)
}
