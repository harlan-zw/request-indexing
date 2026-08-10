import { eq } from 'drizzle-orm'
import { sites } from '~~/layers/core/server/db/schema'
import { broadcastToUser } from '~~/layers/core/server/utils/event-service'
import { defineJob } from '../_types'

export default defineJob({
  name: 'sites/sync-finished',
  queue: 'default',
  async handle(payload, ctx) {
    const { siteId } = payload
    const db = ctx.db

    const site = await db.query.sites.findFirst({
      with: { owner: true },
      where: eq(sites.siteId, siteId),
    }) as (typeof sites.$inferSelect & { owner: { publicId: string } | null }) | undefined

    if (!site)
      throw new Error('Site not found')

    await db.update(sites).set({
      isSynced: true,
      lastSynced: Date.now(),
    }).where(eq(sites.siteId, siteId))

    if (site.owner) {
      broadcastToUser(site.owner.publicId, {
        name: 'sites/sync-finished',
        entityId: siteId,
        entityType: 'site',
        payload: { siteId: site.publicId },
      })
    }
  },
})
