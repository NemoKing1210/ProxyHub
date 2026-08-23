import { readFile } from 'fs/promises'
import { join } from 'path'
import { app } from 'electron'
import type { BackupExportKind, BackupFileV1 } from '@shared/types/backup'
import type { ProxyGroup } from '@shared/types/proxy-group'
import type { Proxy } from '@shared/types/proxy'
import type { AppSettings } from '@shared/types/settings'
import {
  BackupParseError,
  buildBackupPayload,
  createBackupFileV1FromEncrypted,
  isEncryptedBackupFile,
  parseBackupEnvelopeFromContent,
  parsePayloadFromString,
  serializeEncryptedBackupFile,
  serializePlainBackupFile
} from '@shared/utils/backup'
import { encryptBackupPayload, decryptBackupPayload } from '../utils/backup-crypto'
import { logger } from './logger'

const log = logger.scope('backup')
export interface BackupContentInput {
  kind: BackupExportKind
  proxies: Proxy[]
  groups: ProxyGroup[]
  settings: AppSettings
  appVersion: string
  password?: string
}

export async function readAppVersion(): Promise<string> {
  try {
    log.debug('Reading app version')
    const packageContent = await readFile(join(app.getAppPath(), 'package.json'), 'utf-8')
    const packageJson = JSON.parse(packageContent) as { version?: string }
    const version = packageJson.version ?? '0.0.0'
    log.debug('App version resolved', { version })
    return version
  } catch (error) {
    log.error('Failed to read app version', error)
    throw error
  }
}

export function createBackupContent(input: BackupContentInput): string {
  try {
    log.info('Creating backup content', {
      kind: input.kind,
      proxies: input.proxies.length,
      groups: input.groups.length,
      encrypted: Boolean(input.password)
    })
    const exportedAt = new Date().toISOString()
    const payload = buildBackupPayload(input)

    if (input.password) {
      const { ciphertext, encryption } = encryptBackupPayload(
        `${JSON.stringify(payload)}\n`,
        input.password
      )

      const content = serializeEncryptedBackupFile({
        exportedAt,
        appVersion: input.appVersion,
        payloadKind: input.kind,
        encryption,
        payload: ciphertext
      })
      log.info('Encrypted backup created', { kind: input.kind })
      return content
    }

    const content = serializePlainBackupFile(payload, input.appVersion, exportedAt)
    log.info('Plain backup created', { kind: input.kind })
    return content
  } catch (error) {
    log.error('Failed to create backup content', error)
    throw error
  }
}

export function loadBackupFile(content: string, password?: string): BackupFileV1 {
  try {
    log.debug('Loading backup file', { hasPassword: Boolean(password), size: content.length })
    const envelope = parseBackupEnvelopeFromContent(content)

    if (!isEncryptedBackupFile(envelope)) {
      log.info('Loaded plain backup file', { kind: envelope.payload.kind })
      return envelope
    }

    log.debug('Backup is encrypted, decrypting', { kind: envelope.payloadKind })
    if (!password) {
      log.warn('Encrypted backup requires password')
      throw new BackupParseError('password_required', 'Backup password is required')
    }

    let plaintext: string

    try {
      plaintext = decryptBackupPayload(envelope.payload, envelope.encryption, password)
    } catch (error) {
      log.error('Failed to decrypt backup payload', error)
      throw new BackupParseError('wrong_password', 'Wrong backup password')
    }

    const payload = parsePayloadFromString(plaintext)
    const result = createBackupFileV1FromEncrypted(envelope, payload)
    log.info('Encrypted backup decrypted', { kind: result.payload.kind })
    return result
  } catch (error) {
    if (error instanceof BackupParseError) {
      log.warn('Failed to load backup file', { code: error.code, message: error.message })
      throw error
    }
    log.error('Failed to load backup file', error)
    throw error
  }
}
