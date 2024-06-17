import { searchconsole } from '@googleapis/searchconsole'
import {
  sitePathDateAnalytics,
  sitePaths,
  sites,
} from '~/server/database/schema'
import { defineJobHandler, queueJob } from '~/server/plugins/eventServiceProvider'
import { createGoogleOAuthClient } from '#imports'
import { generateDefaultQueryBody } from '~/server/app/services/gsc'
import { chunkedBatch } from '~/server/utils/drizzle'
import { incrementUsage } from '~/server/app/services/usage'

export default defineJobHandler(async (event) => {
  const { siteId, start, end, page } = await readBody<{ siteId: number, start: string, end: string, page: number }>(event)
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
  await incrementUsage(site.siteId, 'gsc')
  const { rows, hasNextPage } = await queryPaginated(api, {
    siteUrl: site.property,
    requestBody: {
      ...generateDefaultQueryBody(site, {
        start,
        end,
      }),
      dimensions: ['date', 'page'],
    },
  }, { page, pageSize: 1000 })
  // finished
  if (!rows.length) {
    return {
      // TODO broadcast to all teams which own the site
      broadcastTo: site.owner.publicId,
      siteId: site.publicId,
      start,
      end,
    }
  }
  const pages = rows.map((row) => {
    const [date, page] = row.keys as [string]
    delete row.keys
    return {
      ...row,
      date,
      path: new URL(page).pathname,
    }
  })

  await chunkedBatch(
    pages.map(row => db.insert(sitePaths)
      .values({
        siteId,
        path: row.path,
        isIndexed: true,
        // should be the min of the current value and date
        firstSeenIndexed: sql`MIN(${row.date}, 'first_seen_indexed')`,
      })
      .onConflictDoUpdate({
        target: [sitePaths.siteId, sitePaths.path],
        set: {
          firstSeenIndexed: sql`MIN(${row.date}, 'first_seen_indexed')`,
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
        date: row.date,
        ...set,
      })
      .onConflictDoUpdate({
        target: [sitePathDateAnalytics.siteId, sitePathDateAnalytics.date, sitePathDateAnalytics.path],
        set: { ...set },
      })
  },
  )

  await chunkedBatch(pageInserts)

  // queue another job while we still have pages
  if (hasNextPage) {
    await queueJob('gsc/page', {
      payload: {
        siteId,
        page: page + 1,
        start,
        end,
      },
      queue: 'gsc',
      entityId: siteId,
      entityType: 'site',
    })
  }

  return {
    // TODO broadcast to all teams which own the site
    broadcastTo: site.owner.publicId,
    siteId: site.publicId,
    start,
    end,
  }
})
