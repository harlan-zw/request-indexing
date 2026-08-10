import { logWarn } from '~~/shared/logging'

export interface ForEachSettledResult {
  ok: number
  failed: number
  errors: Array<{ index: number, error: unknown }>
}

// Run `fn` over each item, isolating per-item failures so one bad row never
// aborts a cron batch. Failures are logged with `label`; the task gets back a
// `{ ok, failed }` count so its own metrics stay honest.
//
// Sequential by default — D1/KV bursts from a cron worker would otherwise
// hammer rate limits. Pass `concurrency` to opt-in.
export async function forEachSettled<T>(
  items: readonly T[],
  label: string,
  fn: (item: T, index: number) => Promise<unknown>,
  opts: { concurrency?: number } = {},
): Promise<ForEachSettledResult> {
  const result: ForEachSettledResult = { ok: 0, failed: 0, errors: [] }
  const concurrency = Math.max(1, opts.concurrency ?? 1)

  const run = async (item: T, index: number) => {
    try {
      await fn(item, index)
      result.ok++
    }
    catch (error) {
      result.failed++
      result.errors.push({ index, error })
      logWarn('task.batch_item_failed', error, { label, index })
    }
  }

  if (concurrency === 1) {
    for (let i = 0; i < items.length; i++)
      await run(items[i] as T, i)
  }
  else {
    let cursor = 0
    const workers = Array.from({ length: concurrency }, async () => {
      while (cursor < items.length) {
        const i = cursor++
        await run(items[i] as T, i)
      }
    })
    await Promise.all(workers)
  }

  return result
}
