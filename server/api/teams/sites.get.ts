import { useAuthenticatedUser } from '~/server/app/utils/auth'
import { sites, teamSites } from '~/server/database/schema'

export default defineEventHandler(async (event) => {
  const user = await useAuthenticatedUser(event)

  const db = useDrizzle()

  return await db.select({
    siteId: sites.publicId,
    domain: sites.domain,
    property: sites.property,
  })
    .from(sites)
    .leftJoin(teamSites, and(eq(sites.siteId, teamSites.siteId), eq(teamSites.teamId, user.team.teamId)))
    // .leftJoin(userSites, and(eq(sites.siteId, userSites.siteId), eq(userSites.userId, user.userId)))
    .where(and(
      eq(sites.active, true),
      eq(teamSites.teamId, user.team.teamId),
    ))
    .all()
})
