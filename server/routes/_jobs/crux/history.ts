import {
  siteDateAnalytics, sitePathDateAnalytics, sitePaths,
  sites,
} from '~/server/database/schema'
import { defineJobHandler } from '~/server/plugins/eventServiceProvider'
import { chunkedBatch } from '~/server/utils/drizzle'
import { incrementUsage } from '~/server/app/services/usage'

export default defineJobHandler(async (event) => {
  const { siteId, strategy, path } = await readBody<{ siteId: number, strategy: string, path?: string }>(event)

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
  const rows = await fetchCrux(site.domain!, strategy, path)

  if (!rows?.length) {
    return {
      // TODO broadcast to all teams which own the site
      broadcastTo: site.owner.publicId,
      siteId: site.publicId,
      rows: 0,
    }
  }

  // scanning origin
  if (!path) {
    await useDrizzle().update(sites).set({
      [`has${strategy === 'PHONE' ? 'Mobile' : 'Desktop'}CruxOriginData`]: true,
    }).where(eq(sites.siteId, siteId))

    // insert the rows into siteDateAnalytics
    const inserts = rows.map((set) => {
      return useDrizzle().insert(siteDateAnalytics).values({
        date: set.date,
        siteId,
        ...set,
      }).onConflictDoUpdate({
        target: [siteDateAnalytics.siteId, siteDateAnalytics.date],
        set,
      })
    })

    await chunkedBatch(inserts)
  } else {
    await useDrizzle().update(sitePaths).set({
      [`has${strategy === 'PHONE' ? 'Mobile' : 'Desktop'}CruxOriginData`]: true,
    }).where(and(
      eq(sitePaths.siteId, siteId),
      eq(sitePaths.path, path),
    ))

    // insert the rows into sitePathDateAnalytics
    const inserts = rows.map((set) => {
      console.log('inserting set', set)
      return useDrizzle().insert(sitePathDateAnalytics).values({
        date: set.date,
        siteId,
        path,
        ...set,
      }).onConflictDoUpdate({
        target: [sitePathDateAnalytics.siteId, sitePathDateAnalytics.date, sitePathDateAnalytics.path],
        set,
      })
    })

    await chunkedBatch(inserts)
  }

  return {
    // TODO broadcast to all teams which own the site
    broadcastTo: site.owner.publicId,
    siteId: site.publicId,
    rows: rows.length,
  }
})
