import dayjs from 'dayjs'
import {
  siteDateAnalytics,
  sitePaths,
  sites,
} from '~/server/database/schema'
import { fetchSitemapUrls } from '~/server/app/services/crawler/crawl'
import type { TaskMap } from '~/server/plugins/eventServiceProvider'
import { defineJobHandler } from '~/server/plugins/eventServiceProvider'
import { chunkedBatch } from '~/server/utils/drizzle'
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

  const sitemapUrls = (await fetchSitemapUrls({
    siteUrl: site.domain,
    sitemapPaths: site.sitemaps?.map(s => s.path),
  }))
    .map(r => r.sites)
    .flat()
    .map((r) => {
      return db.insert(sitePaths).values({
        isIndexed: false,
        path: new URL(r).pathname,
        siteId,
      }).onConflictDoNothing()
    })

  await chunkedBatch(sitemapUrls)

  const totalPagesCount = sitemapUrls.flat().length
  await db.insert(siteDateAnalytics).values({
    siteId,
    date: dayjs().format('YYYY-MM-DD'), // gcs format
    totalPagesCount,
  }).onConflictDoUpdate({
    target: [siteDateAnalytics.siteId, siteDateAnalytics.date],
    set: { totalPagesCount },
  })

  return {
    broadcastTo: site.owner.publicId,
    siteId: site.publicId,
    totalPagesCount,
  }
})
