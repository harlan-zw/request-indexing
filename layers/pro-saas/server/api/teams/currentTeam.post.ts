import { and, eq, inArray, or } from 'drizzle-orm'
import { teamSites } from '~~/layers/core/server/db/schema'
import { googleAccounts, sites, teams } from '#layers/pro-saas/server/database'
import { defineProApiHandler } from '#layers/pro-saas/server/utils/handler'
import { ProError } from '#layers/pro-saas/shared/errors'
import { teamSitesUpdateSchema } from '#layers/pro-saas/shared/validators/teams'

// Persist the team's selected Search Console sites + backup preference.
// `team_sites` requires a `googleAccountId`, so we resolve one of the caller's
// own linked Google accounts to satisfy it.
//
// Onboarding completion is not written here any more. It is user scoped and
// `POST /api/pro/onboarding/complete` owns it, so a team settings save can no
// longer close a user's setup gate as a side effect.
export default defineProApiHandler({
  team: { ability: 'manage-sites' },
  body: teamSitesUpdateSchema,
}, async ({ db, caller, team: ctx, body }) => {
  const { backupsEnabled, selectedSites } = body

  // Reject an over-limit selection at the boundary. This endpoint used to
  // accept any number of sites, so the only thing enforcing the limit was the
  // picker's own disabled state. That is how a team reached "5/3".
  const limit = checkTeamSiteSelection(selectedSites.length)
  if (limit._tag === 'OverLimit') {
    throw new ProError('validation_failed', {
      message: `Select up to ${limit.max} sites. You selected ${limit.selected}.`,
    })
  }

  // Sites are team scoped, so the picker may only name a site this team
  // already owns or one the caller created. Selecting a site the caller
  // created elsewhere moves it onto this team, which is what picking it means.
  const realSites = selectedSites.length
    ? await db.select({ siteId: sites.id })
        .from(sites)
        .where(and(inArray(sites.publicId, selectedSites), or(eq(sites.teamId, ctx.team.teamId), eq(sites.ownerId, caller.user.id))))
        .all()
    : []

  let googleAccountId: number | null = null
  if (realSites.length) {
    const account = await db.select({ id: googleAccounts.googleAccountId })
      .from(googleAccounts)
      .where(eq(googleAccounts.userId, caller.user.id))
      .orderBy(googleAccounts.googleAccountId)
      .get()
    if (!account)
      throw new ProError('validation_failed', { message: 'Connect a Google account before selecting sites' })
    googleAccountId = account.id
  }

  await db.update(teams).set({
    backupsEnabled: backupsEnabled === undefined ? ctx.team.backupsEnabled : (backupsEnabled ? 1 : 0),
    updatedAt: Date.now(),
  }).where(eq(teams.teamId, ctx.team.teamId))

  await db.delete(teamSites).where(eq(teamSites.teamId, ctx.team.teamId))

  if (realSites.length && googleAccountId) {
    await db.update(sites)
      .set({ teamId: ctx.team.teamId })
      .where(inArray(sites.id, realSites.map(site => site.siteId)))

    await db.insert(teamSites).values(realSites.map(site => ({
      teamId: ctx.team.teamId,
      siteId: site.siteId,
      googleAccountId,
    })))
  }

  return {
    teamId: ctx.team.teamId,
    backupsEnabled: backupsEnabled ?? !!ctx.team.backupsEnabled,
    sitesSelected: realSites.length,
  }
})
