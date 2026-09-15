import assert from 'node:assert/strict'
import process from 'node:process'
import { google } from 'googleapis'
import nock from 'nock'

nock.disableNetConnect()
const scopes = []
google.auth.GoogleAuth.prototype.getClient = async function () {
  scopes.push(this.scopes)
  const auth = new google.auth.OAuth2()
  auth.setCredentials({ access_token: 'test-token', expiry_date: Date.now() + 3600000 })
  return auth
}
const fail = { error: { code: 429, message: 'Test quota exhausted', errors: [{ reason: 'rateLimitExceeded' }] } }
const mode = process.env.TEST_MODE
const api = nock('https://indexing.googleapis.com').matchHeader('authorization', 'Bearer test-token')
if (mode !== 'metadata')
  api.post('/v3/urlNotifications:publish', { url: 'https://example.com/jobs/42', type: 'URL_UPDATED' }).reply(mode === 'failure' ? 429 : 200, mode === 'failure' ? fail : { urlNotificationMetadata: { url: 'https://example.com/jobs/42' } })
if (mode === 'bulk')
  api.post('/v3/urlNotifications:publish', { url: 'https://example.com/jobs/43', type: 'URL_UPDATED' }).reply(429, fail)
if (mode === 'metadata')
  api.get('/v3/urlNotifications/metadata').query({ url: 'https://example.com/jobs/42' }).reply(200, { url: 'https://example.com/jobs/42', latestUpdate: { type: 'URL_UPDATED', notifyTime: '2026-09-15T00:00:00Z' } })
process.on('exit', () => {
  assert(nock.isDone(), JSON.stringify(nock.pendingMocks()))
  assert(scopes.length > 0)
  assert(scopes.every(s => s.includes('https://www.googleapis.com/auth/indexing')))
})
