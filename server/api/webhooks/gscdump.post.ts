import { sites } from '~/server/db/schema'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const signature = getHeader(event, 'x-gscdump-signature')

  if (!signature || !config.gscdump.webhookSecret) {
    throw createError({ statusCode: 401, message: 'Missing signature' })
  }

  // HMAC verification
  const body = await readRawBody(event)
  if (!body) {
    throw createError({ statusCode: 400, message: 'Empty body' })
  }

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(config.gscdump.webhookSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
  const expectedSignature = Array.from(new Uint8Array(signatureBytes))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  if (signature !== expectedSignature) {
    throw createError({ statusCode: 401, message: 'Invalid signature' })
  }

  const payload = JSON.parse(body) as {
    event: string
    siteId: string
    siteUrl: string
    data?: Record<string, any>
  }

  const db = useDrizzle()

  switch (payload.event) {
    case 'sync.started': {
      await db.update(sites).set({
        gscdumpSyncStatus: 'syncing',
      }).where(eq(sites.gscdumpSiteId, payload.siteId))
      break
    }
    case 'sync.completed': {
      await db.update(sites).set({
        gscdumpSyncStatus: 'synced',
        isSynced: true,
        lastSynced: Date.now(),
      }).where(eq(sites.gscdumpSiteId, payload.siteId))
      break
    }
    case 'sync.failed': {
      await db.update(sites).set({
        gscdumpSyncStatus: 'error',
      }).where(eq(sites.gscdumpSiteId, payload.siteId))
      break
    }
    case 'auth.failed': {
      // User's Google access was revoked — mark site as error
      await db.update(sites).set({
        gscdumpSyncStatus: 'error',
      }).where(eq(sites.gscdumpSiteId, payload.siteId))
      break
    }
  }

  return { ok: true }
})
