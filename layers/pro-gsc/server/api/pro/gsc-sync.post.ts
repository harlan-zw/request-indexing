import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { useGscdumpClient } from '#layers/pro-gsc/server/utils/gscdump-client'
import { getGscdumpWebhookUrl } from '#layers/pro-gsc/server/utils/gscdump-origin'
import { sites, users } from '#layers/pro-saas/server/database'
import { defineProApiHandler } from '#layers/pro-saas/server/utils/handler'

const bodySchema = z.object({
  siteId: z.number().int().positive(),
  gscSiteUrl: z.string().min(1),
})

export default defineProApiHandler({ body: bodySchema }, async ({ db, caller, body }) => {
  // Get user's gscdump ID
  const [dbUser] = await db
    .select({ gscdumpUserId: users.gscdumpUserId })
    .from(users)
    .where(eq(users.userId, caller.user.id))

  if (!dbUser?.gscdumpUserId)
    throw createError({ statusCode: 400, message: 'Not registered with gscdump' })

  // Verify site belongs to user
  const [site] = await db
    .select()
    .from(sites)
    .where(eq(sites.siteId, body.siteId))

  if (!site || site.ownerId !== caller.user.id)
    throw createError({ statusCode: 404, message: 'Site not found' })

  if (site.gscdumpSiteId)
    throw createError({ statusCode: 400, message: 'Site already synced' })

  // Register with gscdump
  const gscdump = useGscdumpClient()
  const simpleDomain = extractDomain(body.gscSiteUrl)
  await gscdump.waitForUserReady(dbUser.gscdumpUserId)

  const registration = await gscdump.registerSite({
    userId: dbUser.gscdumpUserId,
    requestedUrl: site.property || simpleDomain,
    gscPropertyUrl: body.gscSiteUrl,
    webhookUrl: getGscdumpWebhookUrl(),
    webhookEvents: ['user.lifecycle.changed', 'site.lifecycle.changed', 'site.analytics.ready', 'site.indexing.ready', 'site.auth.failed', 'job.failed'],
  }).catch((err) => {
    const statusCode = err.statusCode || err.status || 500
    const message = err.data?.message || err.message || 'Registration failed'
    // Map gscdump errors to user-friendly messages
    if (statusCode === 404)
      throw createError({ statusCode: 404, message: `Could not find a matching Google Search Console property for "${simpleDomain}". Make sure the site is verified in your Google Search Console account.` })
    throw createError({ statusCode, message })
  })

  // Update site with gscdump info (store normalized domain for consistent lookups)
  await db.update(sites)
    .set({
      gscdumpSiteId: registration.siteId,
      gscdumpSiteUrl: simpleDomain,
    })
    .where(eq(sites.siteId, body.siteId))

  return {
    success: true,
    siteId: registration.siteId,
    status: registration.status,
    indexingEligible: registration.indexingEligible,
    indexingIneligibleReason: registration.indexingIneligibleReason,
  }
})
