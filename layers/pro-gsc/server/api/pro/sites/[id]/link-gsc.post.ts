import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { useGscdumpTeamsClient } from '#layers/pro-gsc/server/utils/gscdump-teams-client'
import { sites, teams, users } from '#layers/pro-saas/server/database'
import { defineProApiHandler } from '#layers/pro-saas/server/utils/handler'

const bodySchema = z.object({
  gscSiteUrl: z.string().min(1),
})

export default defineProApiHandler({ body: bodySchema, site: true }, async ({ event, body, site: access }) => {
  const { db, siteId, caller } = access
  const { gscSiteUrl } = body
  // Normalize: bare domains need a protocol for URL parsing
  const normalizedOrigin = gscSiteUrl.startsWith('sc-domain:') || gscSiteUrl.startsWith('http')
    ? gscSiteUrl
    : `https://${gscSiteUrl}`

  // Get user's gscdump ID
  const [user] = await db.select({ gscdumpUserId: users.gscdumpUserId })
    .from(users)
    .where(eq(users.userId, caller.user.id))
    .limit(1)

  if (!user?.gscdumpUserId)
    throw createError({ statusCode: 400, message: 'Google account not connected to gscdump. Please reconnect your Google account.' })

  // Delegate to autoLinkGsc which handles: find matching GSC property, register if needed, update site row
  const gscdumpSiteId = await autoLinkGsc({
    db,
    gscdumpUserId: user.gscdumpUserId,
    siteId,
    origin: normalizedOrigin,
    preferredSiteUrl: gscSiteUrl,
  })

  if (!gscdumpSiteId)
    throw createError({ statusCode: 404, message: 'GSC site not found or no access' })

  // B3 mirror: bind the gscdump userSite to the pro team's mirrored gscdump team.
  // V1: core sites are owner-scoped (no direct `teamId`). Team→site relation
  // lives on `team_sites`; until pro-gsc is reshaped to consult that mediator,
  // mirror via the owner's currentTeam only.
  const ctx = await db.select({
    siteOwnerId: sites.ownerId,
  })
    .from(sites)
    .where(eq(sites.siteId, siteId))
    .get()

  if (ctx?.siteOwnerId) {
    const owner = await db.select({ gscdumpUserId: users.gscdumpUserId, currentTeamId: users.currentTeamId })
      .from(users)
      .where(eq(users.userId, ctx.siteOwnerId))
      .get()
    const ownerTeam = owner?.currentTeamId
      ? await db.select({ gscdumpTeamId: teams.gscdumpTeamId, teamId: teams.teamId }).from(teams).where(eq(teams.teamId, owner.currentTeamId)).get()
      : null
    if (owner?.gscdumpUserId && ownerTeam?.gscdumpTeamId) {
      const teamsClient = useGscdumpTeamsClient(event)
      await teamsClient.bindSiteToTeam(
        owner.gscdumpUserId,
        gscdumpSiteId,
        { teamId: ownerTeam.gscdumpTeamId },
        { actorUserId: caller.user.id, proTeamId: ownerTeam.teamId },
      )
    }
  }

  return {
    success: true,
    gscdumpSiteId,
    gscdumpSiteUrl: extractDomain(gscSiteUrl),
  }
})
