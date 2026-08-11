// Server-to-server proxy for the gscdump.com user-settings endpoint.
//
// The pro `me` endpoint folds gscdump-owned fields (browserAnalyzerEnabled
// in particular) into a single response. Rather than have the client hit
// gscdump.com cross-origin and us hit it from another endpoint, we proxy
// through here once and KV-cache the result for 60s. Webhook can punch the
// cache when settings change (Phase 7).

import type { GscdumpUserSettings } from '@gscdump/contracts'
import type { PartnerFetch } from '@gscdump/sdk/partner'
import type { H3Event } from 'h3'
import { createPartnerClient } from '@gscdump/sdk/partner'
import { createError } from 'h3'
import { logWarn } from '~~/shared/logging'
import { getGscdumpApiUrl } from './gscdump-origin'

const TTL_SECONDS = 60
const cacheKey = (userId: number): string => `gsc:settings:${userId}`

function normalizeSettings(settings: Partial<GscdumpUserSettings> | null | undefined): GscdumpUserSettings {
  return {
    browserAnalyzerEnabled: settings?.browserAnalyzerEnabled !== false,
  }
}

function getKV(event: H3Event): KVNamespace | null {
  const env = event.context.cloudflare?.env as { KV?: KVNamespace } | undefined
  return env?.KV ?? null
}

function createSettingsClient(event: H3Event, apiKey: string) {
  return createPartnerClient({
    apiBase: getGscdumpApiUrl(event),
    apiKey,
    fetch: $fetch as unknown as PartnerFetch,
  })
}

export async function loadGscdumpSettings(
  event: H3Event,
  userId: number,
  apiKey: string | null,
): Promise<GscdumpUserSettings> {
  if (!apiKey)
    return { browserAnalyzerEnabled: true }

  const kv = getKV(event)
  if (kv) {
    const cached = await kv.get(cacheKey(userId))
    if (cached) {
      const parsed = JSON.parse(cached) as GscdumpUserSettings
      return parsed
    }
  }

  const settings = await createSettingsClient(event, apiKey).getUserSettings().catch((error) => {
    logWarn('gscdump.proxy.failed', error, { stage: 'settings.get', userId })
    return null
  })

  const out = normalizeSettings(settings)

  if (kv) {
    await kv.put(cacheKey(userId), JSON.stringify(out), { expirationTtl: TTL_SECONDS })
      .catch(err => logWarn('kv.best_effort_write_failed', err, { fn: 'gscdumpSettings.cacheWrite', userId }))
  }
  return out
}

export async function patchGscdumpSettings(
  event: H3Event,
  userId: number,
  apiKey: string | null,
  body: Partial<GscdumpUserSettings>,
): Promise<GscdumpUserSettings> {
  if (!apiKey)
    return { browserAnalyzerEnabled: true }

  const updated = await createSettingsClient(event, apiKey).patchUserSettings(body).catch((error) => {
    logWarn('gscdump.proxy.failed', error, { stage: 'settings.patch', userId })
    return null
  })

  if (!updated) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Failed to update gscdump settings',
    })
  }

  const out = normalizeSettings(updated)

  // Bust the cache so the next integration read returns the fresh value.
  const kv = getKV(event)
  if (kv)
    await kv.delete(cacheKey(userId)).catch(err => logWarn('kv.best_effort_write_failed', err, { fn: 'gscdumpSettings.cacheBust', userId }))

  return out
}

export async function invalidateGscdumpSettings(event: H3Event, userId: number): Promise<void> {
  const kv = getKV(event)
  if (!kv)
    return
  await kv.delete(cacheKey(userId)).catch(err => logWarn('kv.best_effort_write_failed', err, { fn: 'invalidateGscdumpSettings', userId }))
}
