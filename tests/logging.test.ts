import type { LogSink } from '../shared/logging'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { addLogSink, LOG_CATALOG, logError, logWarn, removeLogSink } from '../shared/logging'

const registered: LogSink[] = []

function track<T extends LogSink>(sink: T): T {
  registered.push(sink)
  return sink
}

afterEach(() => {
  for (const sink of registered.splice(0))
    removeLogSink(sink)
})

describe('log sink fan-out', () => {
  it('delivers an entry to every registered sink', () => {
    const first = track(vi.fn())
    const second = track(vi.fn())
    addLogSink(first)
    addLogSink(second)

    logWarn('kv.best_effort_write_failed', new Error('kv blip'), { path: '/dashboard' })

    const expected = {
      level: 'warn',
      name: 'kv.best_effort_write_failed',
      description: LOG_CATALOG['kv.best_effort_write_failed'],
      error: { message: 'kv blip', stack: expect.any(String) },
      ctx: { path: '/dashboard' },
    }
    expect(first).toHaveBeenCalledWith(expected)
    expect(second).toHaveBeenCalledWith(expected)
  })

  it('removeLogSink stops delivery', () => {
    const sink = track(vi.fn())
    addLogSink(sink)
    removeLogSink(sink)

    logError('webhook.side_effect_failed', new Error('boom'))

    expect(sink).not.toHaveBeenCalled()
  })

  it('a throwing sink cannot block the other sinks', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const broken = track(() => {
      throw new Error('sink bug')
    })
    const healthy = track(vi.fn())
    addLogSink(broken)
    addLogSink(healthy)

    logError('email.send_failed', new Error('smtp down'))

    expect(healthy).toHaveBeenCalledTimes(1)
    expect(healthy).toHaveBeenCalledWith(expect.objectContaining({ name: 'email.send_failed', level: 'error' }))
    expect(consoleError).toHaveBeenCalled()
    consoleError.mockRestore()
  })

  it('omitted error and ctx arrive as nulls', () => {
    const sink = track(vi.fn())
    addLogSink(sink)

    logWarn('task.batch_item_failed', null)

    expect(sink).toHaveBeenCalledWith({
      level: 'warn',
      name: 'task.batch_item_failed',
      description: LOG_CATALOG['task.batch_item_failed'],
      error: null,
      ctx: null,
    })
  })
})
