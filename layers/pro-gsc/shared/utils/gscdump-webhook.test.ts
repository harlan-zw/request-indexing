// Cross-repo contract test: gscdump.com signs deliveries with a raw
// HMAC-SHA256 hex digest prefixed `sha256=` (its `signWebhookPayload`), and our
// receiver verifies via `@gscdump/sdk/webhook`. If those two ever drift, every
// webhook silently 401s and lifecycle state stops converging, so pin the
// agreement against a signature produced the way gscdump produces one.
//
// SDK 3.x removed the `Result`-returning parser. The receiver now calls
// `verifyWebhookSignature` for the 401 decision and parses the envelope
// separately, so both halves are pinned here.

import { parseWebhookPayload, verifyWebhookSignature } from '@gscdump/sdk/webhook'
import { describe, expect, it } from 'vitest'

const SECRET = 'whsec_test_secret'

async function signLikeGscdump(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  const hex = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('')
  return `sha256=${hex}`
}

const envelope = {
  contractVersion: '2026-05-11',
  deliveryId: 'whd_11111111-1111-4111-8111-111111111111',
  event: 'site.analytics.ready',
  partnerId: 'p_requestindexing',
  userId: 'usr_123',
  siteId: 'site_123',
  externalUserId: null,
  externalSiteId: null,
  lifecycleRevision: 1778457600,
  occurredAt: '2026-05-11T00:00:00.000Z',
  data: {},
}

describe('gscdump webhook verification', () => {
  it('accepts a delivery signed the way gscdump signs it', async () => {
    const body = JSON.stringify(envelope)

    const verified = await verifyWebhookSignature(body, await signLikeGscdump(body, SECRET), SECRET)

    expect(verified).toBe(true)
  })

  it('rejects a body tampered with after signing', async () => {
    const signature = await signLikeGscdump(JSON.stringify(envelope), SECRET)
    const tampered = JSON.stringify({ ...envelope, userId: 'usr_attacker' })

    const verified = await verifyWebhookSignature(tampered, signature, SECRET)

    expect(verified).toBe(false)
  })

  it('rejects an unsigned delivery', async () => {
    const verified = await verifyWebhookSignature(JSON.stringify(envelope), null, SECRET)

    expect(verified).toBe(false)
  })

  it('reads the envelope the receiver dispatches on', async () => {
    const parsed = await parseWebhookPayload(JSON.stringify(envelope), { validateSignature: false })

    expect(parsed.deliveryId).toBe(envelope.deliveryId)
    expect(parsed.event).toBe('site.analytics.ready')
    expect(parsed.siteId).toBe('site_123')
  })
})
