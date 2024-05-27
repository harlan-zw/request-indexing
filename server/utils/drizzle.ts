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
export function chunkedBatch<T extends any[]>(arr: T, chunkSize: number = 100): Promise<any[]> {
  const db = useDrizzle()
  const chunks: T[][] = arr.reduce((acc: any[], _, row) => {
    if (acc.length === 0 || acc[acc.length - 1].length >= chunkSize)
      acc.push([])

    acc[acc.length - 1].push(row)
    return acc
  }, [])
  // batch them
  return Promise.all(chunks.map(chunk => db.batch(chunk)))
}

export type User = typeof schema.users.$inferSelect
