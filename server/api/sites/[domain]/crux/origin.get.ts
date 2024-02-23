import { requireEventSite } from '~/server/app/services/util'
import { fetchCrux } from '~/server/app/services/crux'

// credits to Daniel Roe (https://github.com/danielroe/page-speed.dev/blob/main/server/api/crux/%5Bdomain%5D.get.ts)

export default defineCachedEventHandler(async (event) => {
  const site = await requireEventSite(event)
  return fetchCrux(site.domain)
}, {
  base: 'pagespeed',
  swr: true,
  shouldBypassCache: () => !!import.meta.dev,
  getKey: event => `crux:domain:${getRouterParam(event, 'domain')}`,
  maxAge: 60 * 60,
  staleMaxAge: 24 * 60 * 60,
})
