import type { H3Event } from 'h3'
import { sites } from '~/server/database/schema'

export async function requireEventSite(event: H3Event) {
  const params = getRouterParams(event, { decode: true })
  const { siteId } = params
  const site = await useDrizzle().query.sites.findFirst({
    where: eq(sites.publicId, siteId),
  })
  if (!site) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Site not found',
    })
  }
  return site
}
