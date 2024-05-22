import {
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
  }).where(eq(sites.siteId, siteId))

  // we need to get all non-indexed site paths
  // and start the indexing process
  const _sitePaths = await db.query.sitePaths.findMany({
    where: and(
      eq(sitePaths.siteId, site.siteId),
      eq(sitePaths.isIndexed, false),
    ),
  })

  await batchJobs(
    {
      name: 'web-indexing',
    },
    _sitePaths.map(p => ({
      name: 'paths/gscInspect',
      payload: {
        siteId,
        path: p.path,
      },
    })),
  )

  // TODO start web indexing process

  return {
    // TODO broadcast to all teams which own the site
    broadcastTo: site.owner?.publicId,
    siteId: site.publicId,
  }
})
