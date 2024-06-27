import { searchconsole } from '@googleapis/searchconsole'
import {
  siteKeywordDateAnalytics,
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
  const { rows: keywords, hasNextPage } = await queryPaginated(api, {
    siteUrl: site.property,
    requestBody: {
      ...generateDefaultQueryBody(site, {
        start,
        end,
      }),
      dimensions: ['date', 'query'],
    },
  }, { page, pageSize: 1000 })
    .then((res) => {
      return {
        ...res,
        rows: res.rows.map((row) => {
          const [date, keyword] = row.keys
          delete row.keys
          return {
            ...row,
            date,
            keyword,
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
      start,
      end,
    }
  }
  const inserts = keywords.map(row => db.insert(siteKeywordDateAnalytics)
    .values({
      siteId,
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

  // queue another job while we still have pages
  if (hasNextPage) {
    await queueJob('gsc/query', {
      payload: {
        siteId,
        start,
        end,
        page: page + 1,
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
