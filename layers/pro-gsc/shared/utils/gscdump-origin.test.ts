import { describe, expect, it } from 'vitest'
import {
  gscdumpApiBase,
  gscdumpPartnerApiUrl,
  normalizeGscdumpApiUrl,
  normalizeGscdumpWebhookUrl,
} from './gscdump-origin'

describe('normalizeGscdumpApiUrl', () => {
  it('strips a stray /partner suffix so partner calls do not double the segment', () => {
    expect(normalizeGscdumpApiUrl('https://gscdump.com/api/partner')).toBe('https://gscdump.com/api')
    expect(gscdumpPartnerApiUrl('https://gscdump.com/api/partner')).toBe('https://gscdump.com/api/partner')
    expect(gscdumpApiBase('https://gscdump.com/api/partner')).toBe('https://gscdump.com')
  })

  it('strips trailing slashes', () => {
    expect(normalizeGscdumpApiUrl('http://localhost:3001/api//')).toBe('http://localhost:3001/api')
  })

  it('falls back to the hosted api root when unconfigured', () => {
    expect(normalizeGscdumpApiUrl(undefined)).toBe('https://gscdump.com/api')
    expect(normalizeGscdumpApiUrl('')).toBe('https://gscdump.com/api')
  })
})

describe('normalizeGscdumpWebhookUrl', () => {
  it('returns the configured callback so dev can register a tunnel', () => {
    expect(normalizeGscdumpWebhookUrl('https://abc123.trycloudflare.com/api/webhooks/gscdump'))
      .toBe('https://abc123.trycloudflare.com/api/webhooks/gscdump')
  })

  it('defaults to our own origin, never a sibling partner', () => {
    expect(normalizeGscdumpWebhookUrl(undefined)).toBe('https://requestindexing.com/api/webhooks/gscdump')
  })
})
