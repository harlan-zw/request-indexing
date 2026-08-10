import type { SQLiteTable } from 'drizzle-orm/sqlite-core'
import type { H3Event } from 'h3'
import { and, eq } from 'drizzle-orm'

/**
 * Verify a sub-resource (keyword, competitor, etc.) belongs to the current site.
 * Combines requireSiteAccess + resource lookup + 404 check.
 *
 * @param event - H3 event
 * @param table - Drizzle table (must have `id` and `siteId` columns)
 * @param paramName - Route param name for the resource ID (e.g. 'keywordId')
 */
export async function requireResource<T extends SQLiteTable & { id: any, siteId: any }>(
  event: H3Event,
  table: T,
  paramName: string,
) {
  const access = await requireSiteAccess(event)
  const resourceId = getRouterParam(event, paramName)

  if (!resourceId)
    throw createError({ statusCode: 400, message: `Missing ${paramName}` })

  const [resource] = await access.db.select()
    .from(table)
    .where(and(
      eq(table.id, resourceId),
      eq(table.siteId, access.siteId),
    ))
    .limit(1)

  if (!resource)
    throw createError({ statusCode: 404, statusMessage: 'Not found' })

  return { ...access, resource, resourceId }
}
