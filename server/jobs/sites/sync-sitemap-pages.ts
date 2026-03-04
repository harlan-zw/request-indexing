import dayjs from 'dayjs'
import { fetchSitemapUrls } from '~/server/app/services/crawler/crawl'
import { siteDateAnalytics, sitePaths, sites } from '~/server/db/schema'
import { chunkedBatch } from '~/server/utils/drizzle'
import { broadcastToUser } from '~/server/utils/event-service'
import { defineJob } from '../_types'

export default defineJob({
  name: 'sites/sync-sitemap-pages',
  queue: 'default',
  async handle(payload, ctx) {
    const { siteId } = payload
    const db = ctx.db

    const site = await db.query.sites.findFirst({
      with: { owner: true },
      where: eq(sites.siteId, siteId),
    })

    if (!site || !site.owner)
      throw new Error('Site or User not found')

    const sitemapUrls = (await fetchSitemapUrls({
      siteUrl: site.domain,
      sitemapPaths: site.sitemaps?.map(s => s.path),
    }))
      .map(r => r.sites)
      .flat()
      .map(r =>
        db.insert(sitePaths).values({
          isIndexed: false,
          path: new URL(r).pathname,
          siteId,
        }).onConflictDoNothing(),
      )

    await chunkedBatch(sitemapUrls)

    const totalPagesCount = sitemapUrls.flat().length
    await db.insert(siteDateAnalytics).values({
      siteId,
      date: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
      totalPagesCount,
    }).onConflictDoUpdate({
      target: [siteDateAnalytics.siteId, siteDateAnalytics.date],
      set: { totalPagesCount },
    })

    // Broadcast
    broadcastToUser(site.owner.publicId, {
      name: 'sites/sync-sitemap-pages',
      entityId: siteId,
      entityType: 'site',
      payload: { siteId: site.publicId, totalPagesCount },
    })
  },
})
