import type { H3Event } from 'h3'
import { drizzle } from 'drizzle-orm/d1'
import * as schema from '../db/schema'

export { and, eq, or, sql } from 'drizzle-orm'

export const tables = schema

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null

export function useDrizzle(event?: H3Event) {
  if (_db)
    return _db

  // In production/CF Workers, get D1 from cloudflare env
  if (event) {
    const d1 = (event.context.cloudflare?.env as { DB?: D1Database })?.DB
    if (d1) {
      _db = drizzle(d1, { schema })
      return _db
    }
  }

  // Try to get from global context (for background tasks, etc.)
  // @ts-expect-error - globalThis may have cloudflare context
  const globalD1 = globalThis.__env__?.DB || globalThis.DB
  if (globalD1) {
    _db = drizzle(globalD1, { schema })
    return _db
  }

  throw new Error('D1 database not available. Make sure DB binding is configured in wrangler.toml')
}

/**
 * We can't send more than a certain kb threshold to the db at once, we need to chunk them up further.
 */
export async function chunkedBatch<T extends any[]>(arr: T, chunkSize: number = 0): Promise<any[]> {
  const db = useDrizzle()
  // dynamic chunk size based on arr length with cloudflare worker and d1 limits
  if (chunkSize === 0) {
    chunkSize = Math.max(100, Math.ceil(arr.length / 100))
  }
  const chunks: T[][] = arr.reduce((acc: any[], val) => {
    if (acc.length === 0 || acc[acc.length - 1].length >= chunkSize)
      acc.push([])

    acc[acc.length - 1].push(val)
    return acc
  }, [])

  await Promise.all(chunks.map(async (workload) => {
    if (workload.length)
      await db.batch(workload)
  }))
}

export type User = typeof schema.users.$inferSelect
