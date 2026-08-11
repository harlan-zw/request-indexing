import type { EventPayload } from '#domain-events/server'
import { defineListener } from '@harlan-zw/nuxt-domain-events/server'
import { eq } from 'drizzle-orm'
import { users } from '#layers/pro-saas/server/database'
import { autoLinkGsc } from '../utils/auto-link-gsc'

export default defineListener({
  name: 'gsc.site-added-auto-link',
  event: 'pro:site:added',
  execution: { _tag: 'sync', failure: 'isolate' },
  handle: async ({ event, siteId, url, userId }: EventPayload<'pro:site:added'>) => {
    const db = useDrizzle(event)
    const user = await db.select({ gscdumpUserId: users.gscdumpUserId }).from(users).where(eq(users.userId, userId)).get()
    if (!user?.gscdumpUserId)
      return
    await autoLinkGsc({
      db,
      gscdumpUserId: user.gscdumpUserId,
      siteId,
      origin: url,
      availableSites: event.context.gscAvailableSites,
    })
  },
})
