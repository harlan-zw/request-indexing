import {
  siteDateAnalytics,
  sites,
} from '~/server/database/schema'
import { defineJobHandler } from '~/server/plugins/eventServiceProvider'
import { fetchCrux } from '#imports'
import { chunkedBatch } from '~/server/utils/drizzle'
import { incrementUsage } from '~/server/app/services/usage'

export default defineJobHandler(async (event) => {
  const { siteId, strategy } = await readBody<{ siteId: number, strategy: string }>(event)

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

  // check we haven't already done this date
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
  await incrementUsage(site.siteId, 'crux')
  const rows = await fetchCrux(site.domain!, strategy)

  if (!rows?.length) {
    return {
      // TODO broadcast to all teams which own the site
      broadcastTo: site.owner.publicId,
      siteId: site.publicId,
      rows: 0,
    }
  }

  // insert the rows into siteDateAnalytics
  const inserts = rows.map((set) => {
    return useDrizzle().insert(siteDateAnalytics).values({
      date: set.date,
      siteId,
      ...set,
    }).onConflictDoUpdate({
      target: [siteDateAnalytics.siteId, siteDateAnalytics.date],
      set,
    }).returning()
  })

  await chunkedBatch(inserts)

  return {
    // TODO broadcast to all teams which own the site
    broadcastTo: site.owner.publicId,
    siteId: site.publicId,
    rows: rows.length,
  }
})
