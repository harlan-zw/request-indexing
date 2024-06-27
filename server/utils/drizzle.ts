import { drizzle } from 'drizzle-orm/d1'

import * as schema from '../database/schema'

export { sql, eq, and, or } from 'drizzle-orm'

export const tables = schema

export function useDrizzle() {
  return drizzle(hubDatabase(), { schema })
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
