import dayjs from 'dayjs'
import type {
  SiteUrlSelect,
} from '~/server/database/schema'
import {
  siteDateAnalytics,
  siteUrls,
  sites,
} from '~/server/database/schema'
import { fetchSitemapUrls } from '~/server/app/services/crawler/crawl'
import { defineJobHandler } from '~/server/plugins/eventServiceProvider'
// import { wsUsers } from '~/server/routes/_ws'

export default defineJobHandler(async (event) => {
  const { siteId } = await readBody<{ siteId: number }>(event)

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

  const sitemapUrls: SiteUrlSelect[] = (await fetchSitemapUrls({
    siteUrl: site.domain,
    sitemapPaths: site.sitemaps?.map(s => s.path),
  }))
    .map(r => r.sites)
    .flat()
    .map((r) => {
      return <SiteUrlSelect> {
        isIndexed: false,
        path: new URL(r).pathname,
        siteId,
      }
    })
  // TODO queue
  if (sitemapUrls.length > 0)
    await db.batch(sitemapUrls.map(row => db.insert(siteUrls).values(row).onConflictDoNothing()))

  await db.insert(siteDateAnalytics).values({
    siteId,
    date: dayjs().format('YYYY-MM-DD'), // gcs format
    pagesCount: sitemapUrls.length,
  }).onConflictDoUpdate({
    target: [siteDateAnalytics.siteId, siteDateAnalytics.date],
    set: { pagesCount: sitemapUrls.length },
  })

  // queue top 3 pages to have their performance scanned
  // TODO only after they have selected it as a site
  // await Promise.all(
  //   urls
  //     .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
  //     .slice(0, 2)
  //     .map(row => ['mobile', 'desktop'].map((strategy) => {
  //       return mq.message('/api/_mq/cron/daily/site/psi', {
  //         siteId: site.siteId,
  //         page: row.path,
  //         strategy,
  //       })
  //     }))
  //     .flat(),
  // )

  return {
    res: 'OK',
  }
})
