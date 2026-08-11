import { and, eq, inArray } from 'drizzle-orm'
import { teamSites } from '~~/layers/core/server/db/schema'
import { googleAccounts, sites, teams } from '#layers/pro-saas/server/database'
import { defineProApiHandler } from '#layers/pro-saas/server/utils/handler'
import { ProError } from '#layers/pro-saas/shared/errors'
import { teamOnboardingUpdateSchema } from '#layers/pro-saas/shared/validators/teams'

// Team onboarding: persist the selected GSC sites + backup preference for the
// caller's current team. `team_sites` requires a `googleAccountId`, so we
// resolve one of the caller's own linked Google accounts to satisfy it.
export default defineProApiHandler({
  team: { ability: 'manage-sites' },
  body: teamOnboardingUpdateSchema,
}, async ({ db, caller, team: ctx, body }) => {
  const { onboardedStep, backupsEnabled, selectedSites } = body

  const realSites = selectedSites.length
    ? await db.select({ siteId: sites.siteId })
        .from(sites)
        .where(and(inArray(sites.publicId, selectedSites), eq(sites.ownerId, caller.user.id)))
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
    onboardedStep: onboardedStep ?? ctx.team.onboardedStep,
    backupsEnabled: backupsEnabled === undefined ? ctx.team.backupsEnabled : (backupsEnabled ? 1 : 0),
    updatedAt: Date.now(),
  }).where(eq(teams.teamId, ctx.team.teamId))

  await db.delete(teamSites).where(eq(teamSites.teamId, ctx.team.teamId))

  if (realSites.length && googleAccountId) {
    await db.insert(teamSites).values(realSites.map(site => ({
      teamId: ctx.team.teamId,
      siteId: site.siteId,
      googleAccountId,
    })))
  }

  return {
    teamId: ctx.team.teamId,
    onboardedStep: onboardedStep ?? ctx.team.onboardedStep,
    backupsEnabled: backupsEnabled ?? !!ctx.team.backupsEnabled,
    sitesSelected: realSites.length,
  }
})
