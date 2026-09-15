import type { H3Event } from 'h3'
import type { LogSink } from '../shared/logging'
import { createError, defineEventHandler } from 'h3'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineProApiHandler } from '../layers/pro-saas/server/utils/handler'
import { addLogSink, removeLogSink } from '../shared/logging'

vi.mock('../layers/pro-saas/server/utils/get-caller', () => ({
  getCaller: vi.fn(),
  requireCaller: vi.fn(),
}))
vi.mock('../layers/pro-saas/server/utils/require-current-team', () => ({
  requireCurrentTeam: vi.fn(),
}))
vi.mock('../layers/pro-saas/server/utils/require-site-access', () => ({
  requireSiteAccess: vi.fn(),
}))

vi.stubGlobal('defineEventHandler', defineEventHandler)
vi.stubGlobal('setResponseHeader', vi.fn())
vi.stubGlobal('createError', createError)

vi.spyOn(console, 'error').mockImplementation(() => {})

const sinks: LogSink[] = []

function track<T extends LogSink>(sink: T): T {
  sinks.push(sink)
  return sink
}

afterEach(() => {
  for (const sink of sinks.splice(0))
    removeLogSink(sink)
})

function makeEvent(): H3Event {
  return { context: {} } as unknown as H3Event
}

describe('defineProApiHandler unhandled-error branch', () => {
  it('keeps the root cause on the thrown 500 envelope', async () => {
    const root = new Error('db exploded')
    const handler = defineProApiHandler(() => {
      throw root
    })
    const event = makeEvent()

    const error = await handler(event).catch((e: unknown) => e)

    expect(error.statusCode).toBe(500)
    expect(error.data).toMatchObject({
      code: 'internal_error',
      message: 'Internal error',
      requestId: (event.context as { requestId: string }).requestId,
    })
    expect(error.cause).toBe(root)
  })

  it('reports the root cause to the logging sinks with the requestId', async () => {
    const sink = track(vi.fn())
    addLogSink(sink)
    const handler = defineProApiHandler(() => {
      throw new Error('db exploded')
    })
    const event = makeEvent()

    const error = await handler(event).catch((e: unknown) => e)
    const entry = sink.mock.calls.map(c => c[0] as { name: string, level: string, error: { message: string } | null, ctx: Record<string, unknown> | null })
      .find(e => e.name === 'handler.unhandled_error')

    expect(entry).toBeDefined()
    expect(entry!.level).toBe('error')
    expect(entry!.error?.message).toBe('db exploded')
    expect(entry!.ctx).toMatchObject({ requestId: (error.data as { requestId: string }).requestId })
  })
})
