import { defineCheck, pass, runChecks, runExternalChecks } from '@harlan-zw/nuxt-checkin/external'
import { afterEach, expect, it, vi } from 'vitest'
import reportCheck from '../checks/external/report'
import sentryCheck from '../checks/external/sentry'
import { externalCheckin } from '../shared/checkin-external'

const now = new Date('2026-09-14T10:00:00Z')
const identity = { site: 'requestindexing.com', environment: 'production', deployment: 'release-1' }
const checks = [reportCheck, sentryCheck]
const env = { CHECKIN_TOKEN: 'private-token', CHECKIN_DEPLOYMENT: 'release-1', SENTRY_AUTH_TOKEN: 'sentry-token', SENTRY_ORG: 'harlan-zw' }

afterEach(() => vi.unstubAllGlobals())

function siteReport(deployment = identity.deployment, observedAt = now) {
  return runChecks(['request-indexing.database', 'request-indexing.integration'].map(id => defineCheck({ id, run: () => pass({}) })), { now: observedAt, identity: { ...identity, deployment } })
}

it('combines the authenticated report with Sentry findings', async () => {
  const report = await siteReport()
  const request = vi.fn(async (input: string | URL, options?: RequestInit) => {
    const url = String(input)
    if (url.includes('/api/internal/') || url.includes('/api/admin/')) {
      expect(options?.redirect).toBe('error')
      expect(new Headers(options?.headers).get('authorization')).toBe('Bearer private-token')
      return Response.json(report)
    }
    expect(new Headers(options?.headers).get('cookie')).toBeNull()
    expect(new Headers(options?.headers).get('authorization')).not.toBe('Bearer private-token')
    return url.includes('sentry.io') ? Response.json([{ id: '123' }]) : new Response('Homepage')
  })
  vi.stubGlobal('fetch', request)
  const result = await runExternalChecks(checks, externalCheckin, { env, clock: () => now })
  expect(result.report).toMatchObject({ severity: 'warn', coverage: 'complete', identity })
  expect(result.exitCode).not.toBe(0)
  expect(JSON.stringify(result.report)).not.toContain('private-token')
})

it('keeps absent credentials visible as incomplete coverage', async () => {
  const request = vi.fn(async (_url: string) => new Response('Homepage'))
  vi.stubGlobal('fetch', request)
  const result = await runExternalChecks(checks, externalCheckin, { env: {}, clock: () => now })
  expect(result.report.coverage).toBe('incomplete')
  expect(result.exitCode).not.toBe(0)
  expect(request).not.toHaveBeenCalled()
})

it('rejects another deployment as production evidence', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(await siteReport('old'))))
  const result = await runExternalChecks([reportCheck], { ...externalCheckin, required: [reportCheck.id] }, { env, clock: () => now })
  expect(result.report.results[0]?.result._tag).toBe('Unavailable')
  expect(result.report.coverage).toBe('incomplete')
})

it('validates timestamps after the response body finishes', async () => {
  const observed = new Date(now.getTime() + 5000)
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(await siteReport(identity.deployment, observed))))
  const result = await runExternalChecks([reportCheck], { ...externalCheckin, required: [reportCheck.id] }, { env, now, clock: () => new Date(observed.getTime() + 1000) })
  expect(result.report).toMatchObject({ severity: 'pass', coverage: 'complete' })
  expect(result.exitCode).toBe(0)
})
