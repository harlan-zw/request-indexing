import { searchconsole } from '@googleapis/searchconsole'
import {
  siteDateAnalytics,
  siteKeywordDateAnalytics,
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

  const { rows: keywords, hasNextPage } = await queryPaginated(api, {
    siteUrl: site.property,
    requestBody: {
      ...generateDefaultQueryBody(site, {
        start: date,
        end: date,
      }),
      dimensions: ['query'],
    },
  }, { page, pageSize: 5_000 })
    .then((res) => {
      return {
        ...res,
        rows: res.rows.map((row) => {
          const keys = row.keys
          delete row.keys
          return {
            ...row,
            keyword: keys![0],
          }
        }),
      }
    })
  // finished
  if (!keywords.length) {
    return {
      // TODO broadcast to all teams which own the site
      broadcastTo: site.owner.publicId,
      siteId: site.publicId,
      date,
    }
  }
  const inserts = keywords.map(row => db.insert(siteKeywordDateAnalytics)
    .values({
      siteId,
      date,
      ...row,
    })
    .onConflictDoUpdate({
      target: [siteKeywordDateAnalytics.siteId, siteKeywordDateAnalytics.date, siteKeywordDateAnalytics.keyword],
      set: {
        ...row,
      },
    }),
  )
  await chunkedBatch(inserts)

  // const totalPageClicks = pages.reduce((acc, row) => acc + row.clicks, 0)
  // const totalPageImpressions = pages.reduce((acc, row) => acc + row.impressions, 0)
  // const totalPageCtr = totalPageImpressions ? totalPageClicks / totalPageImpressions : 0
  // const totalPagePosition = pages.reduce((acc, row) => acc + row.position, 0) / pages.length
  // store analytics for the day
  await db.insert(siteDateAnalytics).values({
    siteId,
    date,
    keywords: keywords.length, // keep track of total pages being shown each day
  }).onConflictDoUpdate({
    target: [siteDateAnalytics.siteId, siteDateAnalytics.date],
    set: {
      keywords: keywords.length,
    },
  })

  // queue another job while we still have pages
  if (hasNextPage) {
    await queueJob('gsc/query', {
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
