import { useMessageQueue } from '~/lib/nuxt-ttyl/runtime/nitro/mq'

export default defineEventHandler(async (event) => {
  const { user } = event.context.authenticatedData
  const { force: _force, scope } = getQuery(event)
  const force = String(_force) === 'true'

  // const store = userAppStorage(user.userId, `sites`)

  const mq = useMessageQueue()
  if (force) {
    user.sites = []
    await user.save()
    await store.removeItem(`sites.json`)
    await mq.message('/api/_mq/ingest/sites', { user: { userId: user.userId, email: user.email } })
    return { sites: [], isPending: true }
  }
  let sites = user.sites
  // need a way to ping the message-queue
  if (!sites)
    return { sites: [], isPending: true }

  // filter for user.selectedSites
  if (user.selectedSites && scope !== 'all')
    sites = sites.filter(s => user.selectedSites.includes(s.domain))

  return { sites, isPending: false }
})
