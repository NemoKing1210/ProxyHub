import { execFile } from 'child_process'
import { promisify } from 'util'
import type { Proxy } from '@shared/types/proxy'

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
    const { stdout } = await execFileAsync('reg', ['query', REG_PATH, '/v', valueName], { windowsHide: true })
    const lines = stdout.split('\n')
    for (const line of lines) {
      if (line.includes(valueName)) {
        const parts = line.trim().split(/\s+/)
        // format: ProxyEnable    REG_DWORD    0x1  OR ProxyServer    REG_SZ    http=...
        const idx = parts.findIndex((p) => p === 'REG_DWORD' || p === 'REG_SZ' || p === 'REG_EXPAND_SZ')
        if (idx !== -1 && idx + 1 < parts.length) {
          return parts.slice(idx + 1).join(' ')
        }
      }
    }
    return null
  } catch {
    return null
  }
}

export async function getSystemProxy(): Promise<SystemProxyInfo> {
  if (!isWindows()) {
    return { enabled: false, server: null }
  }

  const enableRaw = await regQueryValue('ProxyEnable')
  const serverRaw = await regQueryValue('ProxyServer')

  let enabled = false
  if (enableRaw) {
    const val = enableRaw.trim().toLowerCase()
    enabled = val === '0x1' || val === '1' || val === '0x01'
  }

  const server = serverRaw ? serverRaw.trim() : null
  return { enabled, server }
}

export async function setSystemProxy(proxy: Proxy): Promise<SystemProxyInfo> {
  if (!isWindows()) {
    throw new Error('System proxy is only supported on Windows')
  }

  const server = buildProxyServer(proxy)

  await execFileAsync('reg', ['add', REG_PATH, '/v', 'ProxyEnable', '/t', 'REG_DWORD', '/d', '1', '/f'], {
    windowsHide: true
  })

  await execFileAsync('reg', ['add', REG_PATH, '/v', 'ProxyServer', '/t', 'REG_SZ', '/d', server, '/f'], {
    windowsHide: true
  })

  // Ensure ProxyOverride keeps bypass for local addresses
  try {
    const override = await regQueryValue('ProxyOverride')
    if (!override) {
      await execFileAsync(
        'reg',
        ['add', REG_PATH, '/v', 'ProxyOverride', '/t', 'REG_SZ', '/d', '<local>', '/f'],
        { windowsHide: true }
      )
    }
  } catch {
    // ignore
  }

  return { enabled: true, server }
}

export async function clearSystemProxy(): Promise<SystemProxyInfo> {
  if (!isWindows()) {
    throw new Error('System proxy is only supported on Windows')
  }

  await execFileAsync('reg', ['add', REG_PATH, '/v', 'ProxyEnable', '/t', 'REG_DWORD', '/d', '0', '/f'], {
    windowsHide: true
  })

  return { enabled: false, server: null }
}

export function isProxyActiveAsSystemProxy(proxy: Proxy, info: SystemProxyInfo | null): boolean {
  if (!info || !info.enabled || !info.server) return false
  const hostPort = `${proxy.host}:${proxy.port}`
  return info.server.includes(hostPort)
}
