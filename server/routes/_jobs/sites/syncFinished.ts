import {
  siteDateAnalytics,
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
    limit: 100, // TODO need to find a way to batch this
  })

  if (!_sitePaths.length) {
    await batchJobs(
      {
        name: 'site-batch',
      },
      [
        ..._sitePaths.map(p => ({
          name: 'paths/gscInspect',
          payload: {
            siteId,
            path: p.path,
          },
        })),
        ..._siteDates.map(p => ({
          name: 'sites/syncGscDate',
          payload: {
            siteId,
            date: p.date,
          },
        })),
      ],
    )
  }

  // need to start ingesting dates that we have not yet ingested

  // TODO start web indexing process

  return {
    // TODO broadcast to all teams which own the site
    broadcastTo: site.owner?.publicId,
    siteId: site.publicId,
  }
})
