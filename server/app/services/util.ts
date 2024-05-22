import type { H3Event } from 'h3'
import type { UserSelect } from '~/server/database/schema'
import { sites, teamSites, teams } from '~/server/database/schema'

export async function requireEventSite(event: H3Event, user: UserSelect) {
  const params = getRouterParams(event, { decode: true })
  const { siteId } = params
  // find the team first
  const team = await useDrizzle().query.teams.findFirst({
    where: eq(teams.teamId, user.currentTeamId),
  })
  if (!team) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Team not found',
    })
  }
  const site = await useDrizzle().query.sites.findFirst({
    where: eq(sites.publicId, siteId),
    with: {
      teamSites: {
        where: eq(teamSites.teamId, team.teamId),
        with: {
          googleAccount: {
            with: {
              googleOAuthClient: true,
            },
          },
        },
      },
    },
  })
  if (!site) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Site not found',
    })
  }
  if (!site.teamSites[0].googleAccount) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Google Account not found',
    })
  }
  return { site, googleAccount: site.teamSites[0].googleAccount }
}
