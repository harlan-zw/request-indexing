// Partner webhook receiver for gscdump.com.
//
// This is the URL we register with every site (`getGscdumpWebhookUrl`), so it
// must accept the canonical envelope for all six events gscdump can deliver,
// not just sync completion.
//
// Auth is the HMAC in `X-GSCDump-Signature` over the exact request bytes, keyed
// by the partner webhook secret. gscdump sends no API key on deliveries, so a
// key comparison would reject every real webhook.
//
// Deliveries are invalidation signals, not state: we dedupe by delivery id,
// resolve the local rows, and re-read authoritative state from the partner API
// (via the onboarding reconcile) rather than building state from the payload.

import type { WebhookEnvelope } from '@gscdump/contracts'
import { parseWebhookPayloadResult, WEBHOOK_SIGNATURE_HEADER } from '@gscdump/sdk/webhook'
import { eq } from 'drizzle-orm'
import { logWarn } from '~~/shared/logging'
import { scheduleGscdumpOnboardingReconcile } from '#layers/pro-gsc/server/utils/reconcile-gscdump-onboarding'
import { syncStatusPatch } from '#layers/pro-gsc/shared/utils/gscdump-webhook'
import { sites, users } from '#layers/pro-saas/server/database'
import { dispatchProEvent } from '#layers/pro-saas/server/utils/dispatch'

// Events that mean "the account or property state moved"; re-read lifecycle so
// onboarding converges without waiting for the reconcile cron.
const RECONCILE_EVENTS = new Set<WebhookEnvelope['event']>([
  'user.lifecycle.changed',
  'site.lifecycle.changed',
  'site.analytics.ready',
  'site.indexing.ready',
  'site.auth.failed',
])

const DEDUPE_TTL_SECONDS = 60 * 60 * 24

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const secret = config.gscdump?.webhookSecret
  if (!secret) {
    // Fail closed. Accepting unsigned deliveries would let anyone who learns
    // the URL drive reconciles for arbitrary users.
    throw createError({ statusCode: 500, message: 'NUXT_GSCDUMP_WEBHOOK_SECRET not configured' })
  }

  const raw = await readRawBody(event, 'utf8')
  if (!raw)
    throw createError({ statusCode: 400, message: 'Empty webhook body' })

  // Pass the signature explicitly. `headers` on the SDK option bag is the
  // parsed `PartnerWebhookHeaders` shape, not raw HTTP header names, so handing
  // it h3's header record reads `signature` as undefined and fails every check.
  const parsed = await parseWebhookPayloadResult(raw, {
    secret,
    signature: getHeader(event, WEBHOOK_SIGNATURE_HEADER) ?? null,
  })
  if (!parsed.ok) {
    logWarn('gscdump.proxy.failed', parsed.error, { stage: 'webhook_signature' })
    throw createError({ statusCode: 401, message: 'Invalid webhook signature' })
  }

  const envelope = parsed.value

  // Retries reuse the delivery id, so a second arrival of work we already did
  // is a no-op rather than a duplicate reconcile.
  const dedupeKey = `gscdump:webhook:${envelope.deliveryId}`
  const storage = useStorage('cache')
  if (await storage.hasItem(dedupeKey))
    return { ok: true, deduped: true }
  await storage.setItem(dedupeKey, envelope.occurredAt, { ttl: DEDUPE_TTL_SECONDS })

  const db = useDrizzle(event)

  const localSite = envelope.siteId
    ? await db.query.sites.findFirst({
        columns: { siteId: true, ownerId: true },
        where: eq(sites.gscdumpSiteId, envelope.siteId),
      })
    : undefined

  const localUser = envelope.userId
    ? await db.query.users.findFirst({
        columns: { userId: true, currentTeamId: true },
        where: eq(users.gscdumpUserId, envelope.userId),
      })
    : undefined

  if (!localUser) {
    // A delivery for a user we do not know is not an error on our side; ack it
    // so gscdump stops retrying, but leave a trail because it usually means a
    // stale registration pointing at us.
    logWarn('gscdump.proxy.failed', new Error('unknown gscdump user'), {
      stage: 'webhook_unknown_user',
      gscdumpUserId: envelope.userId,
      event: envelope.event,
    })
    return { ok: true, unknownUser: true }
  }

  // Mirror the delivery onto the local site row so the dashboard reflects sync
  // state immediately, without waiting for the reconcile to finish its
  // authoritative lifecycle re-read. Recovered from the hand-rolled receiver
  // this route replaced, whose own event names never matched a real delivery.
  if (localSite) {
    const patch = syncStatusPatch(envelope.event, Date.now())
    if (patch) {
      await db.update(sites)
        .set(patch)
        .where(eq(sites.siteId, localSite.siteId))
    }
  }

  if (RECONCILE_EVENTS.has(envelope.event)) {
    scheduleGscdumpOnboardingReconcile(event, {
      userId: localUser.userId,
      gscdumpUserId: envelope.userId!,
      currentTeamId: localUser.currentTeamId ?? null,
    })
  }

  await dispatchProEvent(event, 'pro:gsc:webhook', {
    envelope,
    userId: localUser.userId,
    siteId: localSite?.siteId ?? null,
  }).catch((err: unknown) => logWarn('webhook.side_effect_failed', err, { event: envelope.event }))

  return { ok: true }
})
