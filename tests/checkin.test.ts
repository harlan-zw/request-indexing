import { runChecks } from '@harlan-zw/nuxt-checkin/server'
import { expect, it } from 'vitest'
import database from '../server/checks/database'
import integration from '../server/checks/integration'

it('keeps an intentional notification and sync pause healthy', async () => {
  const report = await runChecks([integration], { event: { notificationsEnabled: false, gscdump: { apiKey: 'private', webhookSecret: 'private' } } })
  expect(report.coverage).toBe('complete')
  expect(report.results[0]?.result).toEqual({ _tag: 'Pass', evidence: { configured: true, notificationsEnabled: false, dailySyncPaused: true } })
  expect(JSON.stringify(report)).not.toContain('private')
})

it('marks missing integration credentials unavailable', async () => {
  const report = await runChecks([integration], { event: { notificationsEnabled: true, gscdump: { apiKey: '', webhookSecret: '' } } })
  expect(report.coverage).toBe('incomplete')
})

it('checks the actual Cloudflare binding through the public D1 check', async () => {
  const statements: string[] = []
  const event = { context: { cloudflare: { env: { DB: { prepare(sql: string) {
    statements.push(sql)
    return { first: async () => ({ checkin_ready: 1 }) }
  } } } } } }
  const report = await runChecks([database], { event })
  expect(report.coverage).toBe('complete')
  expect(statements).toEqual(['SELECT 1 AS checkin_ready'])
})
