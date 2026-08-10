import { createPsiClientFromEvent } from '~~/layers/core/server/app/services/psi'
import { authenticateUser } from '~~/layers/core/server/app/utils/auth'

export default defineCachedEventHandler(async (event) => {
  const user = await authenticateUser(event)
  const psi = await createPsiClientFromEvent(event, user)
  return psi.run('/')
}, {
  base: 'pagespeed',
  swr: true,
  shouldBypassCache: () => !!import.meta.dev,
  getKey: event => `crux:domain:${getRouterParam(event, 'domain')}`,
  maxAge: 60 * 60,
  staleMaxAge: 24 * 60 * 60,
})
