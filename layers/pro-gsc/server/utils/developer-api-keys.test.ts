import { createGscdumpV1Client } from '@gscdump/sdk/v1'
import { describe, expect, it } from 'vitest'
import { ProError } from '#layers/pro-saas/shared/errors'
import {
  createDeveloperApiKey,
  createDeveloperApiKeyBody,
  listDeveloperApiKeys,
  revokeDeveloperApiKey,
} from './developer-api-keys'

const meta = { requestId: 'req_01', surface: 'partner', version: '1.0' }

function clientReturning(status: number, body: unknown) {
  const calls: string[] = []
  const client = createGscdumpV1Client({
    apiRoot: 'https://gscdump.test/api',
    credential: 'gsd_dev_partner',
    retry: { maxAttempts: 1 },
    fetch: async (request) => {
      calls.push(String(request))
      return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
    },
  })
  return { client, calls }
}

function gscdumpError(status: number, code: string) {
  return clientReturning(status, { error: { code, message: code, requestId: 'req_01', retryable: false, details: {} } })
}

async function caught(promise: Promise<unknown>): Promise<unknown> {
  return promise.then(() => null, (error: unknown) => error)
}

describe('listDeveloperApiKeys', () => {
  it('asks for Search Console without calling gscdump when the user has no gscdump user', async () => {
    const { client, calls } = clientReturning(200, { data: { keys: [] }, meta })
    await expect(listDeveloperApiKeys(client, null)).resolves.toEqual({ _tag: 'SearchConsoleRequired' })
    expect(calls).toEqual([])
  })

  it('returns the keys with timestamps in milliseconds', async () => {
    const { client } = clientReturning(200, {
      data: { keys: [{ keyId: 'ak_01', preview: 'gsd_user_012...cdef', label: 'Laptop', createdAt: 1789516800, lastUsedAt: null }] },
      meta,
    })
    await expect(listDeveloperApiKeys(client, 'u_01')).resolves.toEqual({
      _tag: 'Ready',
      keys: [{ keyId: 'ak_01', preview: 'gsd_user_012...cdef', label: 'Laptop', createdAt: 1789516800000, lastUsedAt: null }],
    })
  })
})

describe('createDeveloperApiKeyBody', () => {
  it.each([
    [{ label: '  Laptop CLI ' }, { success: true, label: 'Laptop CLI' }],
    [{ label: '   ' }, { success: false }],
    [{ label: 'x'.repeat(65) }, { success: false }],
    [{}, { success: false }],
  ])('parses %j', (input, expected) => {
    const result = createDeveloperApiKeyBody.safeParse(input)
    expect(result.success ? { success: true, label: result.data.label } : { success: false }).toEqual(expected)
  })
})

describe('createDeveloperApiKey', () => {
  it('returns the raw key once with the creation time in milliseconds', async () => {
    const { client } = clientReturning(201, {
      data: { keyId: 'ak_01', apiKey: 'gsd_user_abc123', preview: 'gsd_user_abc...c123', label: 'Laptop', createdAt: 1789516800 },
      meta,
    })
    await expect(createDeveloperApiKey(client, 'u_01', { label: 'Laptop' })).resolves.toEqual({
      keyId: 'ak_01',
      apiKey: 'gsd_user_abc123',
      preview: 'gsd_user_abc...c123',
      label: 'Laptop',
      createdAt: 1789516800000,
    })
  })

  it('rejects with search_console_required when the user has no gscdump user', async () => {
    const { client } = clientReturning(201, {})
    const error = await caught(createDeveloperApiKey(client, null, { label: 'Laptop' }))
    expect(error).toBeInstanceOf(ProError)
    expect(error).toMatchObject({ code: 'search_console_required', statusCode: 409 })
  })

  it('turns the gscdump key limit into a conflict that tells the user to revoke a key', async () => {
    const { client } = gscdumpError(409, 'api_key_limit_reached')
    const error = await caught(createDeveloperApiKey(client, 'u_01', { label: 'Laptop' }))
    expect(error).toMatchObject({
      code: 'conflict',
      statusCode: 409,
      message: 'You can have 10 API keys. Revoke a key, then create a new one.',
    })
  })

  it('lets other gscdump failures propagate unchanged', async () => {
    const { client } = gscdumpError(401, 'unauthorized')
    const error = await caught(createDeveloperApiKey(client, 'u_01', { label: 'Laptop' }))
    expect(error).not.toBeInstanceOf(ProError)
    expect(error).toMatchObject({ code: 'unauthorized', status: 401 })
  })
})

describe('revokeDeveloperApiKey', () => {
  it('revokes the key for the given gscdump user', async () => {
    const { client, calls } = clientReturning(200, { data: { ok: true, keyId: 'ak_01' }, meta })
    await expect(revokeDeveloperApiKey(client, 'u_01', 'ak_01')).resolves.toEqual({ keyId: 'ak_01' })
    expect(calls).toEqual(['https://gscdump.test/api/partner/v1/users/u_01/api-keys/ak_01'])
  })

  it.each([undefined, 'u_01', 'ak_../../users'])('rejects the key ID %j before calling gscdump', async (keyId) => {
    const { client, calls } = clientReturning(200, {})
    const error = await caught(revokeDeveloperApiKey(client, 'u_01', keyId))
    expect(error).toMatchObject({ code: 'validation_failed', statusCode: 400 })
    expect(calls).toEqual([])
  })

  it('turns an unknown key into not_found', async () => {
    const { client } = gscdumpError(404, 'api_key_not_found')
    const error = await caught(revokeDeveloperApiKey(client, 'u_01', 'ak_01'))
    expect(error).toMatchObject({ code: 'not_found', statusCode: 404 })
  })
})
