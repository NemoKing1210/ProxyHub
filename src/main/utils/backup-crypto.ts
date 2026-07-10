import { createCipheriv, createDecipheriv, pbkdf2Sync, randomBytes } from 'crypto'
import {
  BACKUP_KDF_ITERATIONS
} from '../../shared/constants/backup-crypto'
import type { BackupEncryptionMeta } from '../../shared/types/backup'

const KEY_LENGTH_BYTES = 32
const SALT_LENGTH_BYTES = 16
const IV_LENGTH_BYTES = 12

function deriveKey(password: string, salt: Buffer, iterations: number): Buffer {
  return pbkdf2Sync(password, salt, iterations, KEY_LENGTH_BYTES, 'sha256')
}

export function encryptBackupPayload(
  plaintext: string,
  password: string
): { ciphertext: string; encryption: BackupEncryptionMeta } {
  const salt = randomBytes(SALT_LENGTH_BYTES)
  const iv = randomBytes(IV_LENGTH_BYTES)
  const key = deriveKey(password, salt, BACKUP_KDF_ITERATIONS)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  return {
    ciphertext: encrypted.toString('base64'),
    encryption: {
      algorithm: 'AES-256-GCM',
      kdf: 'PBKDF2-SHA256',
      iterations: BACKUP_KDF_ITERATIONS,
      salt: salt.toString('base64'),
      iv: iv.toString('base64'),
      tag: tag.toString('base64')
    }
  }
}

export function decryptBackupPayload(
  ciphertext: string,
  encryption: BackupEncryptionMeta,
  password: string
): string {
  if (
    encryption.algorithm !== 'AES-256-GCM' ||
    encryption.kdf !== 'PBKDF2-SHA256' ||
    !Number.isInteger(encryption.iterations) ||
    encryption.iterations < 1
  ) {
    throw new Error('Unsupported backup encryption parameters')
  }

  const salt = Buffer.from(encryption.salt, 'base64')
  const iv = Buffer.from(encryption.iv, 'base64')
  const tag = Buffer.from(encryption.tag, 'base64')
  const encrypted = Buffer.from(ciphertext, 'base64')
  const key = deriveKey(password, salt, encryption.iterations)
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)

  try {
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
  } catch {
    throw new Error('Wrong backup password')
  }
}
