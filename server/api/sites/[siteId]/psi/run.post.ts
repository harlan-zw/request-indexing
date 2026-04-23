import { createPsiClientFromEvent } from '~/server/app/services/psi'

export default defineCachedEventHandler(async (event) => {
  const psi = await createPsiClientFromEvent(event)
  return psi.run('/')
}, {
  base: 'pagespeed',
  swr: true,
  shouldBypassCache: () => !!import.meta.dev,
  getKey: event => `crux:domain:${getRouterParam(event, 'domain')}`,
  maxAge: 60 * 60,
  staleMaxAge: 24 * 60 * 60,
})
