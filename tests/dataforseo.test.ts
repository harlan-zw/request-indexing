import { describe, expect, it, vi } from 'vitest'
import { checkUrlIndexed, tagDataForSeoTasks } from '../layers/core/server/app/services/dataforseo'
import { DATAFORSEO_RETRY_OPTIONS, runDataForSEORequest } from '../shared/dataforseo'

describe('dataForSEO requests', () => {
  it('attributes every provider task to its app and target Site', () => {
    const tagged = tagDataForSeoTasks([
      { keyword: 'site:https://docs.example.com/guide' },
      { target: 'shop.example.net' },
    ], 'bulk-check', 'request-123')

    expect(tagged.map(task => task.tag)).toEqual([
      'v=1&app=request-indexing.com&site=docs.example.com&source=bulk-check&request=request-123&task=0',
      'v=1&app=request-indexing.com&site=shop.example.net&source=bulk-check&request=request-123&task=1',
    ])
  })

  it('adds attribution at the provider transport boundary', async () => {
    const fetchMock = vi.fn(async (_url: string, _options: { body: Array<{ tag: string }> }) => ({
      tasks: [{ result: [{ total: 0, items: [] }] }],
    }))
    await checkUrlIndexed('https://docs.example.com/guide', {
      budgetMicros: 0,
      credentials: { login: 'login', password: 'password' },
      providerFetch: fetchMock as unknown as typeof $fetch,
      storage: {
        getItem: async () => null,
        setItem: () => Promise.resolve(),
      },
    })

    expect(fetchMock).toHaveBeenCalledOnce()
    const options = fetchMock.mock.calls[0]![1]
    expect(options.body[0]?.tag).toMatch(
      /^v=1&app=request-indexing\.com&site=docs\.example\.com&source=internal&request=[^&]+&task=0$/,
    )
  })

  it('retries transient Cloudflare and upstream failures', () => {
    expect(DATAFORSEO_RETRY_OPTIONS).toEqual(expect.objectContaining({
      retry: 2,
      retryStatusCodes: expect.arrayContaining([429, 500, 520, 524]),
    }))
  })

  it('returns transient upstream errors as expected failures', async () => {
    const outcome = await runDataForSEORequest(() => Promise.reject(
      Object.assign(new Error('upstream unavailable'), { statusCode: 520 }),
    ))

    expect(outcome).toEqual({ _tag: 'Unavailable', statusCode: 520 })
  })

  it('does not hide non-transient failures', async () => {
    const error = Object.assign(new Error('unauthorized'), { statusCode: 401 })

    await expect(runDataForSEORequest(() => Promise.reject(error))).rejects.toBe(error)
  })
})
