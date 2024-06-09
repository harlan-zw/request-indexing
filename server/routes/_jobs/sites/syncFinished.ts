import { desc, like, not, notLike, sum } from 'drizzle-orm'
import {
  siteDateAnalytics,
  siteKeywordDateAnalytics,
  sitePathDateAnalytics,
  sitePaths,
  sites,
} from '~/server/database/schema'
import { batchJobs, defineJobHandler } from '~/server/plugins/eventServiceProvider'

export default defineJobHandler(async (event) => {
  const { siteId } = await readBody<{ siteId: number }>(event)

  const db = useDrizzle()
  const site = await db.query.sites.findFirst({
    with: {
      owner: true,
    },
    where: eq(sites.siteId, siteId),
  })

  if (!site) {
    throw createError({
      statusCode: 404,
      message: 'Site or User not found',
    })
  }
  await db.update(sites).set({
    isSynced: true,
    lastSynced: Date.now(),
  }).where(eq(sites.siteId, siteId))

  // we need to get all non-indexed site paths
  // and start the indexing process
  const _sitePaths = await db.query.sitePaths.findMany({
    where: and(
      eq(sitePaths.siteId, site.siteId),
      eq(sitePaths.isIndexed, false),
    ),
    limit: 100, // TODO need to find a way to batch this
  })

  const _siteDates = await db.query.siteDateAnalytics.findMany({
    where: and(
      eq(siteDateAnalytics.siteId, site.siteId),
      eq(siteDateAnalytics.isSynced, false),
    ),
  })

  const topPages = await useDrizzle()
    .select({
      path: sitePathDateAnalytics.path,
    })
    .from(sitePathDateAnalytics)
    .where(and(
      eq(sitePathDateAnalytics.siteId, site.siteId),
      not(eq(sitePathDateAnalytics.path, '/')),
    ))
    .groupBy(sitePathDateAnalytics.path)
    .orderBy(desc(sum(sitePathDateAnalytics.clicks)))
    .limit(5)

  const topKeywords = await useDrizzle()
    .select({
      keyword: siteKeywordDateAnalytics.keyword,
    })
    .from(siteKeywordDateAnalytics)
    .where(eq(siteKeywordDateAnalytics.siteId, site.siteId))
    .groupBy(siteKeywordDateAnalytics.keyword)
    .orderBy(desc(sum(siteKeywordDateAnalytics.clicks)))
    .limit(12)

  const brandName = site.domain!.split('.')[0].replace('https://', '')
  const topNonBrandedKeywords = await useDrizzle()
    .select({
      keyword: siteKeywordDateAnalytics.keyword,
    })
    .from(siteKeywordDateAnalytics)
    .where(and(
      eq(siteKeywordDateAnalytics.siteId, site.siteId),
      notLike(siteKeywordDateAnalytics.keyword, `%${brandName}%`),
    ))
    .orderBy(desc(sum(siteKeywordDateAnalytics.clicks)))
    .groupBy(siteKeywordDateAnalytics.keyword)
    .limit(12)

  const questionKeywords = await useDrizzle()
    .select({
      keyword: siteKeywordDateAnalytics.keyword,
    })
    .from(siteKeywordDateAnalytics)
    .where(and(
      eq(siteKeywordDateAnalytics.siteId, site.siteId),
      // custom regex
      like(siteKeywordDateAnalytics.keyword, '%how%'),
      like(siteKeywordDateAnalytics.keyword, '%what%'),
      like(siteKeywordDateAnalytics.keyword, '%when%'),
      like(siteKeywordDateAnalytics.keyword, '%where%'),
      like(siteKeywordDateAnalytics.keyword, '%why%'),
      like(siteKeywordDateAnalytics.keyword, '%who%'),
      like(siteKeywordDateAnalytics.keyword, '%which%'),
    ))
    .orderBy(desc(sum(siteKeywordDateAnalytics.clicks)))
    .groupBy(siteKeywordDateAnalytics.keyword)
    .limit(12)

  // join all keywords togethor and remove duplicates, chunk them into batches of 10
  const allKeywords = [
    ...topKeywords,
    ...topNonBrandedKeywords,
    ...questionKeywords,
  ]
  const dedupedChunked = allKeywords.reduce((acc, keyword) => {
    if (!acc.includes(keyword.keyword))
      acc.push(keyword.keyword)
    return acc
  }, []).reduce((acc, keyword, i) => {
    if (i % 10 === 0) {
      acc.push([])
    }
    acc[acc.length - 1].push(keyword)
    return acc
  }, [])

  await batchJobs(
    {
      name: 'site-batch',
    },
    [
      // get adwords data for top keywords
      ...dedupedChunked.map(keywords => ({
        name: 'keywords/adwords',
        queue: 'ads',
        payload: {
          siteId,
          keywords,
        },
      })),
      // run psi test for top pages
      ...topPages.map(p => ([
        {
          name: 'paths/runPsi',
          queue: 'psi',
          priority: -1,
          payload: {
            siteId,
            path: p.path,
            strategy: 'mobile',
          },
        },
        {
          name: 'paths/runPsi',
          queue: 'psi',
          priority: -1,
          payload: {
            siteId,
            path: p.path,
            strategy: 'desktop',
          },
        },
      ])).flat(),
      // ..._sitePaths.map(p => ({
      //   name: 'paths/gscInspect',
      //   queue: 'gsc',
      //   priority: -1,
      //   payload: {
      //     siteId,
      //     path: p.path,
      //   },
      // })),
      // ..._siteDates.map(p => ({
      //   name: 'sites/syncGscDate',
      //   queue: 'gsc',
      //   priority: -1,
      //   payload: {
      //     siteId,
      //     date: p.date,
      //   },
      // })),
    ],
  )

  // need to start ingesting dates that we have not yet ingested

  // TODO start web indexing process

  return {
    // TODO broadcast to all teams which own the site
    _sitePaths: _sitePaths.length,
    broadcastTo: site.owner?.publicId,
    siteId: site.publicId,
  }
})
