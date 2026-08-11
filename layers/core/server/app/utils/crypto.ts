import { Buffer } from 'node:buffer'
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
// @ts-expect-error - ohash is unlisted but provided transitively at runtime
import { hash } from 'ohash'

export function getHashSecure(input: any) {
  const appKey = useRuntimeConfig().key
  // make an object
  return hash({ input, appKey })
}

// Function to encrypt a token
export function encryptToken(token: string, secretKey: string): string {
  if (secretKey.length !== 32)
    throw new Error('Secret key must be 32 characters long for aes-256-gcm.')

  const iv = randomBytes(16) // Initialization vector
  const cipher = createCipheriv('aes-256-gcm', secretKey, iv)

  let encrypted = cipher.update(token, 'utf8', 'hex')
  encrypted += Buffer.from(cipher.final()).toString('hex')

  const authTag = Buffer.from(cipher.getAuthTag()).toString('hex')

  // Return the IV, encrypted token, and authTag in a single string
  return `${Buffer.from(iv).toString('hex')}:${encrypted}:${authTag}`
}

// Function to decrypt a token
export function decryptToken(encryptedToken: string, secretKey: string): string {
  if (secretKey.length !== 32)
    throw new Error('Secret key must be 32 characters long for aes-256-gcm.')

  const parts = encryptedToken.split(':')
  const iv = Buffer.from(parts[0]!, 'hex')
  const encrypted = parts[1]!
  const authTag = Buffer.from(parts[2]!, 'hex')

  const decipher = createDecipheriv('aes-256-gcm', secretKey, iv)
  decipher.setAuthTag(authTag)

  let decrypted: string = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
