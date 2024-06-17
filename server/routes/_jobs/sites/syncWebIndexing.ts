import { count, lte } from 'drizzle-orm'
import {
  siteDateAnalytics,
  sitePaths,
  sites,
} from '~/server/database/schema'
import type { TaskMap } from '~/server/plugins/eventServiceProvider'
import { defineJobHandler } from '~/server/plugins/eventServiceProvider'
import { dayjsPst } from '~/server/utils/dayjs'
// import { wsUsers } from '~/server/routes/_ws'

export default defineJobHandler(async (event) => {
  const { siteId } = await readBody<TaskMap['sites/syncSitemapPages']>(event)

  const db = useDrizzle()
  const site = await db.query.sites.findFirst({
    with: {
      owner: true,
    },
    where: eq(sites.siteId, siteId),
  })

  if (!site || !site.owner) {
    throw createError({
      statusCode: 404,
      message: 'Site or User not found',
    })
  }

  // for the last 90 days, we inspect each day and calculate the total number of pages indexed
  // we calculate this from the count of sitePaths which have firstSeenIndexed <= date and isIndexed = true
  let updates = []
  const start = dayjsPst().subtract(90, 'days').startOf('day')
  for (let i = 0; i < 91; i++) {
    const date = start.clone().add(i, 'days')
    const indexedCountSq = await db.select({
      indexedPagesCount: count().as('indexedPagesCount'),
    }).from(sitePaths)
      .where(and(
        eq(sitePaths.siteId, siteId),
        lte(sitePaths.firstSeenIndexed, date.format('YYYY-MM-DD')),
        eq(sitePaths.isIndexed, true),
      ))
    updates = db.update(siteDateAnalytics).set({
      indexedPagesCount: indexedCountSq[0].indexedPagesCount,
    }).where(and(
      eq(siteDateAnalytics.siteId, siteId),
      eq(siteDateAnalytics.date, date.format('YYYY-MM-DD')),
    ))
  }

  chunkedBatch(updates)

  return {
    broadcastTo: site.owner.publicId,
    siteId: site.publicId,
  }
})
