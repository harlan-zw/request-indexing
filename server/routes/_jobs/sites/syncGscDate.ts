import { searchconsole } from '@googleapis/searchconsole'
import {
  siteDateAnalytics,
  siteKeywordDateAnalytics,
  siteKeywordDatePathAnalytics,
  sitePathDateAnalytics,
  sitePaths,
  sites,
} from '~/server/database/schema'
import { defineJobHandler } from '~/server/plugins/eventServiceProvider'
import { createGoogleOAuthClient } from '#imports'
import { generateDefaultQueryBody } from '~/server/app/services/gsc'
import { chunkedBatch } from '~/server/utils/drizzle'

export default defineJobHandler(async (event) => {
  const { siteId, date } = await readBody<{ siteId: number, date: string }>(event)

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
  const existing = await db.query.siteDateAnalytics.findFirst({
    where: and(
      eq(siteDateAnalytics.siteId, siteId),
      eq(siteDateAnalytics.date, date),
    ),
  })

  if (existing?.clicks) {
    return {
      res: 'Already run',
    }
  }

  const api = searchconsole({
    version: 'v1',
    auth: createGoogleOAuthClient(site.owner.googleAccounts[0]),
  })

  // not all pages will shown when queried with keywords
  const [pages, keywordsAndPages] = await Promise.all([
    (recursiveQuery(api, {
      siteUrl: site.property,
      requestBody: {
        ...generateDefaultQueryBody(site, {
          start: date,
          end: date,
        }),
        dimensions: ['page'],
      },
    }).then(d => d.data.rows || [])),
    (recursiveQuery(api, {
      siteUrl: site.property,
      requestBody: {
        ...generateDefaultQueryBody(site, {
          start: date,
          end: date,
        }),
        dimensions: ['page', 'query'],
      },
    }).then(d => d.data.rows || [])),
    // (recursiveQuery(api, {
    //   siteUrl: site.property,
    //   requestBody: {
    //     ...generateDefaultQueryBody(site, {
    //       start: date,
    //       end: date,
    //     }),
    //     dimensions: ['query'],
    //   },
    // }).then(d => d.data.rows || [])),
  ])

  // extract keywords from keywordsAndPages
  const keywords = Object.values(keywordsAndPages.reduce((acc, row) => {
    const key = row.keys?.[1]
    if (!key)
      return acc

    if (!acc[key]) {
      acc[key] = {
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
        keyword: key,
        pages: [row.keys?.[0]],
      }
    }
    else {
      acc[key].clicks += row.clicks
      acc[key].impressions += row.impressions
      // acc[key].ctr += row.ctr
      // acc[key].position += row.position
      // ctr & position need to be averages
      acc[key].ctr = (acc[key].ctr + row.ctr) / 2
      acc[key].position = (acc[key].position + row.position) / 2
      acc[key].keyword = key
      acc[key].pages.push(row.keys?.[0])
    }
    return acc
  }, {}))

  if (pages.length) {
    // update top level pages so we know which ones are indexed
    await chunkedBatch(
      pages.map(row => db.insert(sitePaths)
        .values({
          siteId,
          path: row.keys?.[0] ? new URL(row.keys[0]).pathname : null,
          isIndexed: true,
          firstSeenIndexed: date,
        })
        .onConflictDoUpdate({
          target: [sitePaths.siteId, sitePaths.path],
          set: {
            firstSeenIndexed: date,
            isIndexed: true,
          },
        }),
      ),
    )

    // we need to chunk the inserts because of the 1MB limit
    const pageInserts = pages.map(row => db.insert(sitePathDateAnalytics)
      .values({
        siteId,
        date,
        path: row.keys?.[0] ? new URL(row.keys[0]).pathname : null,
        ...row,
      })
      .onConflictDoUpdate({
        target: [sitePathDateAnalytics.siteId, sitePathDateAnalytics.date, sitePathDateAnalytics.path],
        set: {
          ...row,
        },
      }),
    )
    await chunkedBatch(pageInserts)
  }

  if (keywords.length) {
    const keywordInserts = keywords.map(row => db.insert(siteKeywordDateAnalytics)
      .values({
        siteId,
        date,
        ...row,
      })
      .onConflictDoUpdate({
        target: [siteKeywordDateAnalytics.siteId, siteKeywordDateAnalytics.date, siteKeywordDateAnalytics.keyword],
        set: row,
      }),
    )
    await chunkedBatch(keywordInserts, 50)
  }

  if (keywordsAndPages.length) {
    const keywordPathInserts = keywordsAndPages.map(row => db.insert(siteKeywordDatePathAnalytics)
      .values({
        siteId,
        date,
        path: row.keys?.[0] ? new URL(row.keys[0]).pathname : null,
        keyword: row.keys?.[1],
        ...row,
      })
      .onConflictDoUpdate({
        target: [siteKeywordDatePathAnalytics.siteId, siteKeywordDatePathAnalytics.date, siteKeywordDatePathAnalytics.keyword, siteKeywordDatePathAnalytics.path],
        set: row,
      }),
    )
    await chunkedBatch(keywordPathInserts, 50)
    // TODO insert count into siteDateAnalytics, need to group keywordsAndPages by path
  }

  const totalPageClicks = pages.reduce((acc, row) => acc + row.clicks, 0)
  const totalPageImpressions = pages.reduce((acc, row) => acc + row.impressions, 0)
  const totalPageCtr = totalPageImpressions ? totalPageClicks / totalPageImpressions : 0
  const totalPagePosition = pages.reduce((acc, row) => acc + row.position, 0) / pages.length
  // store analytics for the day
  await db.insert(siteDateAnalytics).values({
    siteId,
    date,
    clicks: totalPageClicks,
    impressions: totalPageImpressions,
    ctr: totalPageCtr,
    position: totalPagePosition,
    keywords: keywords.length,
    pages: pages.length,
  }).onConflictDoUpdate({
    target: [siteDateAnalytics.siteId, siteDateAnalytics.date],
    set: {
      // TODO set max of either totalPageClicks OR the existing total
      clicks: totalPageClicks,
      impressions: totalPageImpressions,
      ctr: totalPageCtr,
      position: totalPagePosition,
      keywords: keywords.length,
      pages: pages.length,
    },
  })

  return {
    // TODO broadcast to all teams which own the site
    broadcastTo: site.owner.publicId,
    siteId: site.publicId,
    date,
  }
})
