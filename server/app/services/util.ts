import type { H3Event } from 'h3'

export async function requireEventSite(event: H3Event) {
  const params = getRouterParams(event, { decode: true })
  const { domain } = params
  const { user } = event.context.authenticatedData
  const sites = await getSitesCached(user.userId)
  const site = sites.find(s => s.domain === domain)
  if (!site) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Site not found',
    })
  }
  return site
}
