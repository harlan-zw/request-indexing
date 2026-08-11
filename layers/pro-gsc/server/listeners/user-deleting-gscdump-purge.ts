import type { EventPayload } from '#domain-events/server'
import { defineListener } from '@harlan-zw/nuxt-domain-events/server'
import { deletePartnerUser } from '../utils/gscdump-partner-users'

export default defineListener({
  name: 'gsc.user-deleting-purge',
  event: 'pro:user:deleting',
  execution: { _tag: 'sync', failure: 'isolate' },
  handle: async ({ event, gscdumpUserId }: EventPayload<'pro:user:deleting'>) => {
    if (!gscdumpUserId)
      return
    const result = await deletePartnerUser(event, gscdumpUserId)
    if (!result.ok)
      throw new Error(`gscdump partner delete: ${result.message}`)
  },
})
