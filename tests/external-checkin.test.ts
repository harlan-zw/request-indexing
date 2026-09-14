import { expect, it } from 'vitest'
import { runDailyCheckin } from '../scripts/checkin/daily'

it('keeps missing credentials unavailable without network requests', async () => {
  const request = (() => {
    throw new Error('Unexpected request')
  }) as typeof fetch
  const report = await runDailyCheckin({}, request)
  expect(report.coverage).toBe('incomplete')
  expect(report.results.map(check => check.result._tag)).toEqual(['Unavailable', 'Unavailable'])
})

it('validates report deployment and keeps missing Sentry coverage visible', async () => {
  const now = new Date('2026-09-14T00:00:00Z')
  const request = (async (_url, options) => {
    expect(options?.redirect).toBe('error')
    expect(new Headers(options?.headers).get('cookie')).toBe('private-cookie')
    return Response.json({
      schemaVersion: 1,
      observedAt: now.toISOString(),
      identity: { site: 'requestindexing.com', environment: 'production', deployment: 'old' },
      results: ['request-indexing.database', 'request-indexing.integration'].map(id => ({ id, result: { _tag: 'Pass', evidence: {} } })),
    })
  }) as typeof fetch
  const report = await runDailyCheckin({ adminCookie: 'private-cookie', deployment: 'new', sentryOrg: 'harlan-zw' }, request, () => now)
  expect(report.coverage).toBe('incomplete')
  expect(report.results.map(check => check.result._tag)).toEqual(['Unavailable', 'Unavailable'])
  expect(JSON.stringify(report)).not.toContain('private-cookie')
})
