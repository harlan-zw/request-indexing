import { authenticateUser } from '~/server/app/utils/auth'
import {
  sites,
} from '~/server/database/schema'
import { batchJobs } from '~/server/plugins/eventServiceProvider'

export default defineEventHandler(async (e) => {
  // extract from db
  const user = await authenticateUser(e)
  const { siteId } = getRouterParams(e, { decode: true })
  const site = await useDrizzle().query.sites.findFirst({
    where: eq(sites.publicId, siteId),
  })
  if (!site || !user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Site not found',
    })
  }

  // TODO validate

  const body = await readBody<{
    path: string
  }>(e)

  await batchJobs({
    name: 'psi:page',
  }, [
    {
      name: 'paths/runPsi',
      payload: {
        siteId: site.siteId,
        path: body.path,
        strategy: 'desktop',
      },
    },
    {
      name: 'paths/runPsi',
      payload: {
        siteId: site.siteId,
        path: body.path,
        strategy: 'mobile',
      },
    },
  ])

  return 'OK'
})
