import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { useGscdumpClient } from '#layers/pro-gsc/server/utils/gscdump-client'
import { sites } from '#layers/pro-saas/server/database'
import { defineProApiHandler } from '#layers/pro-saas/server/utils/handler'

const bodySchema = z.object({
  gscdumpSiteId: z.string().min(1),
})

export default defineProApiHandler({ body: bodySchema }, async ({ db, body }) => {
  const gscdump = useGscdumpClient()

  // Delete site from gscdump (removes all synced data)
  await gscdump.deleteSite(body.gscdumpSiteId).catch((err) => {
    const status = err.statusCode || err.status || 500
    // 404 is fine - site may already be deleted
    if (status !== 404)
      throw createError({ statusCode: status, message: err.data?.message || 'Failed to delete site from gscdump' })
  })

  // Clear gscdump references from any matching pro site
  const matchingSites = await db.select({ id: sites.siteId })
    .from(sites)
    .where(eq(sites.gscdumpSiteId, body.gscdumpSiteId))

  for (const site of matchingSites) {
    await db.update(sites)
      .set({ gscdumpSiteId: null, gscdumpSiteUrl: null })
      .where(eq(sites.siteId, site.id))
  }

  return { success: true }
})
