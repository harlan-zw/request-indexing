import { searchconsole } from '@googleapis/searchconsole'
import { count, lte } from 'drizzle-orm'
import {
  siteDateAnalytics,
  sitePathDateAnalytics,
  sitePaths,
  sites,
} from '~/server/database/schema'
import { defineJobHandler, queueJob } from '~/server/plugins/eventServiceProvider'
import { createGoogleOAuthClient } from '#imports'
import { generateDefaultQueryBody } from '~/server/app/services/gsc'
import { chunkedBatch } from '~/server/utils/drizzle'

export default defineJobHandler(async (event) => {
  const { siteId, date, page } = await readBody<{ siteId: number, date: string, page: number }>(event)
  const db = useDrizzle()
  const site = await db.query.sites.findFirst({
    with: {
      owner: {
        with: {
          googleAccounts: {
            with: {
              googleOAuthClient: true,
            },
          },
        },
      },
      teamSites: {
        with: {
          googleAccount: true,
        },
      },
    },
    where: eq(sites.siteId, siteId),
  })

  if (!site || !site.owner?.googleAccounts?.[0]) {
    throw createError({
      statusCode: 404,
      message: 'Site or User not found',
    })
  }

  // // check we haven't already done this date
  // const existing = await db.query.siteDateAnalytics.findFirst({
  //   where: and(
  //     eq(siteDateAnalytics.siteId, siteId),
  //     eq(siteDateAnalytics.date, date),
  //   ),
  // })

  // if (existing?.clicks) {
  //   return {
  //     res: 'Already run',
  //   }
  // }

  const api = searchconsole({
    version: 'v1',
    auth: createGoogleOAuthClient(site.owner.googleAccounts[0]),
  })

  const { rows, hasNextPage } = await queryPaginated(api, {
    siteUrl: site.property,
    requestBody: {
      ...generateDefaultQueryBody(site, {
        start: date,
        end: date,
      }),
      dimensions: ['page'],
    },
  }, { page, pageSize: 5000 })
  // finished
  if (!rows.length) {
    return {
      // TODO broadcast to all teams which own the site
      broadcastTo: site.owner.publicId,
      siteId: site.publicId,
      date,
    }
  }
  const pages = rows.map((row) => {
    const keys = row.keys
    delete row.keys
    return {
      ...row,
      path: new URL(keys![0]).pathname,
    }
  })

  await chunkedBatch(
    pages.map(row => db.insert(sitePaths)
      .values({
        siteId,
        path: row.path,
        isIndexed: true,
        // should be the min of the current value and date
        firstSeenIndexed: sql`MIN(${date}, 'first_seen_indexed')`,
      })
      .onConflictDoUpdate({
        target: [sitePaths.siteId, sitePaths.path],
        set: {
          firstSeenIndexed: sql`MIN(${date}, 'first_seen_indexed')`,
          isIndexed: true,
        },
      }),
    ),
  )
  const pageInserts = pages.map((row) => {
    const set = {
      path: row.path,
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    }
    return db.insert(sitePathDateAnalytics)
      .values({
        siteId: site.siteId,
        date,
        ...set,
      })
      .onConflictDoUpdate({
        target: [sitePathDateAnalytics.siteId, sitePathDateAnalytics.date, sitePathDateAnalytics.path],
        set: { ...set },
      })
  },
  )

  await chunkedBatch(pageInserts)

  const pagesIndexed = await db.select({
    count: count(),
  }).from(sitePaths)
    .where(and(
      eq(sitePaths.siteId, siteId),
      lte(sitePaths.firstSeenIndexed, date),
      eq(sitePaths.isIndexed, true),
    ))
    // .groupBy(sitePaths.isIndexed)
    .then(res => res[0].count)
  //
  // store analytics for the day
  await db.insert(siteDateAnalytics).values({
    siteId,
    date,
    pages: pages.length, // keep track of total pages being shown each day
    indexedPagesCount: pagesIndexed,
  }).onConflictDoUpdate({
    target: [siteDateAnalytics.siteId, siteDateAnalytics.date],
    set: {
      indexedPagesCount: pagesIndexed,
      pages: pages.length,
    },
  })

  // queue another job while we still have pages
  if (hasNextPage) {
    await queueJob('gsc/page', {
      siteId,
      date,
      page: page + 1,
    })
  }

  return {
    // TODO broadcast to all teams which own the site
    broadcastTo: site.owner.publicId,
    siteId: site.publicId,
    date,
  }
})
