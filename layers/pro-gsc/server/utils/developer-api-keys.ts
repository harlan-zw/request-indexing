// API keys a user creates on the Developers page.
//
// gscdump issues each key through its partner API, so the key is separate
// from the partner credential this app stores in `users.gscdumpApiKey`. That
// stored credential is never shown. Each operation acts only for the caller's
// own gscdump user, and the raw key passes through once without being stored.

import type { GscdumpV1Client } from '@gscdump/sdk/v1'
import type { CreatedDeveloperApiKey, DeveloperApiKey, DeveloperApiKeysState } from '../../shared/developer-api-keys'
import { isGscdumpV1Error } from '@gscdump/sdk/v1'
import { z } from 'zod'
import { ProError } from '#layers/pro-saas/shared/errors'
import { DEVELOPER_API_KEY_LABEL_MAX, DEVELOPER_API_KEY_LIMIT } from '../../shared/developer-api-keys'

export type DeveloperApiKeyClient = Pick<GscdumpV1Client, 'createUserApiKey' | 'listUserApiKeys' | 'revokeUserApiKey'>

export const createDeveloperApiKeyBody = z.object({
  label: z.string().trim().min(1).max(DEVELOPER_API_KEY_LABEL_MAX),
})

const developerApiKeyId = z.string().regex(/^ak_[\w-]+$/)

// gscdump sends key timestamps as epoch seconds. The page works in
// milliseconds, so convert once here.
function toMillis(seconds: number): number {
  return seconds * 1000
}

function searchConsoleRequired(): ProError {
  return new ProError('search_console_required')
}

// Only the two key-specific gscdump errors get their own copy. Every other
// failure propagates, and the handler reports it as before.
function mapApiKeyError(error: unknown): never {
  if (isGscdumpV1Error(error) && error.code === 'api_key_limit_reached') {
    throw new ProError('conflict', {
      message: `You can have ${DEVELOPER_API_KEY_LIMIT} API keys. Revoke a key, then create a new one.`,
      details: { reason: 'api_key_limit_reached' },
    })
  }
  if (isGscdumpV1Error(error) && error.code === 'api_key_not_found') {
    throw new ProError('not_found', {
      message: 'This API key does not exist. Reload the page to see your current keys.',
      details: { reason: 'api_key_not_found' },
    })
  }
  throw error
}

export async function listDeveloperApiKeys(
  client: DeveloperApiKeyClient,
  gscdumpUserId: string | null,
): Promise<DeveloperApiKeysState> {
  if (!gscdumpUserId)
    return { _tag: 'SearchConsoleRequired' }
  const response = await client.listUserApiKeys({ params: { userId: gscdumpUserId } }).catch(mapApiKeyError)
  const keys: DeveloperApiKey[] = response.data.keys.map(key => ({
    keyId: key.keyId,
    preview: key.preview,
    label: key.label,
    createdAt: toMillis(key.createdAt),
    lastUsedAt: key.lastUsedAt === null ? null : toMillis(key.lastUsedAt),
  }))
  return { _tag: 'Ready', keys }
}

export async function createDeveloperApiKey(
  client: DeveloperApiKeyClient,
  gscdumpUserId: string | null,
  body: z.infer<typeof createDeveloperApiKeyBody>,
): Promise<CreatedDeveloperApiKey> {
  if (!gscdumpUserId)
    throw searchConsoleRequired()
  const response = await client.createUserApiKey({ params: { userId: gscdumpUserId }, body: { label: body.label } }).catch(mapApiKeyError)
  const { keyId, apiKey, preview, label, createdAt } = response.data
  return { keyId, apiKey, preview, label, createdAt: toMillis(createdAt) }
}

export async function revokeDeveloperApiKey(
  client: DeveloperApiKeyClient,
  gscdumpUserId: string | null,
  rawKeyId: unknown,
): Promise<{ keyId: string }> {
  const keyId = developerApiKeyId.safeParse(rawKeyId)
  if (!keyId.success)
    throw new ProError('validation_failed', { message: 'The API key ID is not valid.' })
  if (!gscdumpUserId)
    throw searchConsoleRequired()
  const response = await client.revokeUserApiKey({ params: { userId: gscdumpUserId, keyId: keyId.data } }).catch(mapApiKeyError)
  return { keyId: response.data.keyId }
}
