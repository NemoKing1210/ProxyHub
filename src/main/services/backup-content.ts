import { readFile } from 'fs/promises'
import { join } from 'path'
import { app } from 'electron'
import type { BackupExportKind, BackupFileV1 } from '../../shared/types/backup'
import type { ProxyGroup } from '../../shared/types/proxy-group'
import type { Proxy } from '../../shared/types/proxy'
import type { AppSettings } from '../../shared/types/settings'
import {
  BackupParseError,
  buildBackupPayload,
  createBackupFileV1FromEncrypted,
  isEncryptedBackupFile,
  parseBackupEnvelopeFromContent,
  parsePayloadFromString,
  serializeEncryptedBackupFile,
  serializePlainBackupFile
} from '../../shared/utils/backup'
import { encryptBackupPayload, decryptBackupPayload } from '../utils/backup-crypto'

export interface BackupContentInput {
  kind: BackupExportKind
  proxies: Proxy[]
  groups: ProxyGroup[]
  settings: AppSettings
  appVersion: string
  password?: string
}

export async function readAppVersion(): Promise<string> {
  const packageContent = await readFile(join(app.getAppPath(), 'package.json'), 'utf-8')
  const packageJson = JSON.parse(packageContent) as { version?: string }
  return packageJson.version ?? '0.0.0'
}

export function createBackupContent(input: BackupContentInput): string {
  const exportedAt = new Date().toISOString()
  const payload = buildBackupPayload(input)

  if (input.password) {
    const { ciphertext, encryption } = encryptBackupPayload(
      `${JSON.stringify(payload)}\n`,
      input.password
    )

    return serializeEncryptedBackupFile({
      exportedAt,
      appVersion: input.appVersion,
      payloadKind: input.kind,
      encryption,
      payload: ciphertext
    })
  }

  return serializePlainBackupFile(payload, input.appVersion, exportedAt)
}

export function loadBackupFile(content: string, password?: string): BackupFileV1 {
  const envelope = parseBackupEnvelopeFromContent(content)

  if (!isEncryptedBackupFile(envelope)) {
    return envelope
  }

  if (!password) {
    throw new BackupParseError('password_required', 'Backup password is required')
  }

  let plaintext: string

  try {
    plaintext = decryptBackupPayload(envelope.payload, envelope.encryption, password)
  } catch {
    throw new BackupParseError('wrong_password', 'Wrong backup password')
  }

  const payload = parsePayloadFromString(plaintext)
  return createBackupFileV1FromEncrypted(envelope, payload)
}
