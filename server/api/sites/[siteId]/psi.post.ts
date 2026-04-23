import { authenticateUser } from '~/server/app/utils/auth'
import { sites } from '~/server/db/schema'
import { batchJobs } from '~/server/utils/event-service'

export default defineEventHandler(async (e) => {
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

  const body = await readBody<{ path: string }>(e)
  const db = useDrizzle()
  const env = (e.context.cloudflare?.env ?? {}) as Record<string, unknown>

  await batchJobs(db, env, {
    name: 'psi:page',
    siteId: site.siteId,
  }, [
    {
      name: 'crux/history',
      payload: { siteId: site.siteId, path: body.path, strategy: 'PHONE' },
    },
    {
      name: 'crux/history',
      payload: { siteId: site.siteId, path: body.path, strategy: 'DESKTOP' },
    },
  ])

  return 'OK'
})
