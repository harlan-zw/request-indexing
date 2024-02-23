import type { GoogleSearchConsoleSite } from '~/types'
import { useMessageQueue } from '~/lib/nuxt-ttyl/runtime/nitro/mq'

export default defineEventHandler(async (event) => {
  const { user } = event.context.authenticatedData
  const { force: _force, scope } = getQuery(event)
  const force = String(_force) === 'true'

  // const store = userAppStorage(user.userId, `sites`)

  const mq = useMessageQueue()
  if (force) {
    await store.removeItem(`sites.json`)
    await mq.message('/api/_mq/ingest/sites', { user: { userId: user.userId, email: user.email } })
    return { sites: [], isPending: true }
  }

  // need a way to ping the message-queue
  if (!(await store.hasItem(`sites.json`)))
    return { sites: [], isPending: true }

  let sites = await store.getItem<GoogleSearchConsoleSite[]>(`sites.json`) || []

  // filter for user.selectedSites
  if (user.selectedSites && scope !== 'all')
    sites = sites.filter(s => user.selectedSites.includes(s.domain))

  return { sites, isPending: false }
})
