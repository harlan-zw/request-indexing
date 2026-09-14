import { defineCheck, pass, runChecks } from '@harlan-zw/nuxt-checkin/server'
import { createApp, defineEventHandler, toWebHandler } from 'h3'
import { expect, it, vi } from 'vitest'
import { requireCheckinAuth } from '../server/utils/checkin-auth'

const identity = { site: 'requestindexing.com', environment: 'production', deployment: 'deployed-1' }

function request(path = '/api/internal/checkin', authorization?: string, token = 'private-token', method = 'GET') {
  const collect = vi.fn(() => runChecks([defineCheck({ id: 'health', run: () => pass({ ready: true }) })], { identity }))
  const app = createApp()
  app.use(defineEventHandler(async (event) => {
    requireCheckinAuth(event, token)
    return collect()
  }))
  return { collect, response: toWebHandler(app)(new Request(`https://example.com${path}`, {
    method,
    headers: authorization ? { authorization } : {},
  })) }
}

it.each([undefined, 'Bearer wrong', 'Basic private-token', 'Bearer private-token-extra'])(
  'rejects invalid authentication before collecting: %s',
  async (authorization) => {
    const result = request('/api/internal/checkin', authorization)
    const response = await result.response
    expect(response.status).toBe(401)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(result.collect).not.toHaveBeenCalled()
  },
)

it('rejects an unconfigured token', async () => {
  const result = request('/api/internal/checkin', 'Bearer private-token', '')
  expect((await result.response).status).toBe(401)
  expect(result.collect).not.toHaveBeenCalled()
})

it.each([['/api/admin/users', 'GET'], ['/api/internal/checkin', 'POST'], ['/api/internal/checkin/extra', 'GET']])(
  'limits the token to the report endpoint: %s %s',
  async (path, method) => {
    const result = request(path, 'Bearer private-token', 'private-token', method)
    expect((await result.response).status).toBe(401)
    expect(result.collect).not.toHaveBeenCalled()
  },
)

it('returns the fresh report identity without caching or exposing the token', async () => {
  const response = await request('/api/internal/checkin', 'Bearer private-token').response
  expect(response.status).toBe(200)
  expect(response.headers.get('cache-control')).toBe('no-store')
  const report = await response.json()
  expect(report).toMatchObject({ identity, coverage: 'complete', severity: 'pass' })
  expect(JSON.stringify(report)).not.toContain('private-token')
})
