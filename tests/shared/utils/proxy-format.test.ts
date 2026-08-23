import { describe, expect, it } from 'vitest'
import {
  buildProxyUrl,
  formatProxyAddress,
  isValidMtprotoSecret,
  parseProxyUrl,
  skipsDomainChecks
} from '@shared/utils/proxy-format'

describe('parseProxyUrl', () => {
  it('parses host:port', () => {
    expect(parseProxyUrl('1.2.3.4:8080')).toEqual({
      protocol: 'http',
      host: '1.2.3.4',
      port: 8080,
      username: undefined,
      password: undefined
    })
  })

  it('parses host:port:user:pass style as user@host:port', () => {
    expect(parseProxyUrl('user:p@ss@1.2.3.4:1080')).toMatchObject({
      host: '1.2.3.4',
      port: 1080,
      username: 'user',
      password: 'p@ss'
    })
  })

  it('parses protocol://host:port', () => {
    expect(parseProxyUrl('socks5://1.2.3.4:1080')).toMatchObject({
      protocol: 'socks5',
      host: '1.2.3.4',
      port: 1080
    })
  })

  it('parses protocol://user:pass@host:port with url-encoded auth', () => {
    expect(parseProxyUrl('http://us%40er:pa%3Ass@proxy.example.com:3128')).toEqual({
      protocol: 'http',
      host: 'proxy.example.com',
      port: 3128,
      username: 'us@er',
      password: 'pa:ss'
    })
  })

  it('strips path and query from http urls', () => {
    expect(parseProxyUrl('https://5.6.7.8:8443/some/path?q=1')).toMatchObject({
      protocol: 'https',
      host: '5.6.7.8',
      port: 8443
    })
  })

  it('returns null for empty input', () => {
    expect(parseProxyUrl('   ')).toBeNull()
  })

  it('returns null for missing port', () => {
    expect(parseProxyUrl('example.com')).toBeNull()
  })

  it('returns null for out of range port', () => {
    expect(parseProxyUrl('1.2.3.4:70000')).toBeNull()
  })

  it('returns null for invalid host', () => {
    expect(parseProxyUrl('in valid host:8080')).toBeNull()
  })

  it('returns null for unknown protocol', () => {
    expect(parseProxyUrl('ftp://1.2.3.4:21')).toBeNull()
  })
})

describe('parseProxyUrl (mtproto)', () => {
  const SECRET = 'dd' + 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6'

  it('parses tg://proxy links', () => {
    expect(
      parseProxyUrl(`tg://proxy?server=1.2.3.4&port=443&secret=${SECRET}`)
    ).toEqual({
      protocol: 'mtproto',
      host: '1.2.3.4',
      port: 443,
      secret: SECRET
    })
  })

  it('parses t.me/proxy links and lowercases secret', () => {
    expect(
      parseProxyUrl(`https://t.me/proxy?server=vpn.example.com&port=443&secret=${SECRET.toUpperCase()}`)
    ).toEqual({
      protocol: 'mtproto',
      host: 'vpn.example.com',
      port: 443,
      secret: SECRET
    })
  })

  it('rejects mtproto link without secret', () => {
    expect(parseProxyUrl(`tg://proxy?server=1.2.3.4&port=443`)).toBeNull()
  })

  it('rejects mtproto secret that is too short', () => {
    expect(parseProxyUrl('tg://proxy?server=1.2.3.4&port=443&secret=aabb')).toBeNull()
  })
})

describe('isValidMtprotoSecret', () => {
  it('accepts 32-char even-length hex', () => {
    expect(isValidMtprotoSecret('a'.repeat(32))).toBe(true)
  })

  it('rejects odd length', () => {
    expect(isValidMtprotoSecret('a'.repeat(33))).toBe(false)
  })

  it('rejects non-hex', () => {
    expect(isValidMtprotoSecret('z'.repeat(32))).toBe(false)
  })

  it('rejects empty', () => {
    expect(isValidMtprotoSecret('')).toBe(false)
  })
})

describe('buildProxyUrl', () => {
  it('builds plain url without credentials', () => {
    expect(
      buildProxyUrl({ protocol: 'socks5', host: '1.2.3.4', port: 1080 })
    ).toBe('socks5://1.2.3.4:1080')
  })

  it('encodes credentials', () => {
    expect(
      buildProxyUrl({
        protocol: 'http',
        host: 'proxy.example.com',
        port: 80,
        username: 'us er',
        password: 'p/ss'
      })
    ).toBe('http://us%20er:p%2Fss@proxy.example.com:80')
  })

  it('omits auth when only one credential part is set', () => {
    expect(
      buildProxyUrl({ protocol: 'http', host: 'h', port: 1, username: 'user' })
    ).toBe('http://h:1')
  })
})

describe('formatProxyAddress', () => {
  it('formats host:port', () => {
    expect(formatProxyAddress({ host: '1.2.3.4', port: 8080 })).toBe('1.2.3.4:8080')
  })
})

describe('skipsDomainChecks', () => {
  it.each(['mtproto'])('skips for %s', (protocol) => {
    expect(skipsDomainChecks(protocol as 'mtproto')).toBe(true)
  })

  it.each(['http', 'https', 'socks4', 'socks5'] as const)('does not skip for %s', (protocol) => {
    expect(skipsDomainChecks(protocol)).toBe(false)
  })
})
