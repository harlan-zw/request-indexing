import type { AuthProviderId } from '#layers/pro-saas-auth/shared/types/auth'
import { and, desc, eq } from 'drizzle-orm'
import { teamSites } from '~~/layers/core/server/db/schema'
import { logger } from '~~/shared/server/logger'
import * as schema from '#layers/pro-saas/server/database'
import { hasAuthenticatedSession } from '../utils/session-auth-state'

export default defineNitroPlugin(() => {
  sessionHooks.hook('fetch', async (session, event) => {
    if (import.meta.prerender || !hasAuthenticatedSession(session))
      return

    const db = useDrizzle(event)

    // Admin impersonation: swap session user if cookie is set
    const impersonateUserId = getCookie(event, 'nuxt-seo-impersonate')
    if (impersonateUserId && isAdminEmail(session.user?.email ?? null)) {
      const impersonatedUser = await db.query.users.findFirst({
        where: eq(schema.users.userId, impersonateUserId),
      }).catch(() => null)
      if (impersonatedUser) {
        const primary = await db.query.userIdentities.findFirst({
          where: eq(schema.userIdentities.userId, impersonatedUser.id),
          orderBy: [desc(schema.userIdentities.lastUsedAt)],
        }).catch(() => null)
        session.impersonating = {
          adminEmail: session.user.email ?? '',
          targetUserId: impersonatedUser.id,
          targetDisplayName: primary?.displayName ?? null,
        }
        session.user = {
          id: impersonatedUser.id,
          email: primary?.email ?? impersonatedUser.email ?? null,
          name: primary?.displayName ?? null,
          avatarUrl: primary?.avatarUrl ?? null,
          authProvider: (primary?.provider ?? 'github') as AuthProviderId,
          currentTeamId: impersonatedUser.currentTeamId ?? null,
        }
      }
    }

    const user = await db.query.users.findFirst({
      where: eq(schema.users.userId, session.user!.id),
    }).catch(() => null)

    if (!user) {
      await clearUserSession(event)
      return
    }

    // Remap session.user from the primary identity row. Provider-agnostic
    // shape (id/name/avatarUrl/authProvider) on every authenticated request.
    // See google-signin-plan.md Round 9.
    const allIdentities = await db.query.userIdentities.findMany({
      where: eq(schema.userIdentities.userId, user.userId),
      orderBy: [desc(schema.userIdentities.lastUsedAt)],
    }).catch(() => [])
    const primaryIdentity = allIdentities[0] ?? null
    const primaryIdentityEmail = primaryIdentity?.email ?? null

    if (primaryIdentity) {
      session.user = {
        id: user.userId,
        email: primaryIdentity.email ?? user.email ?? null,
        name: primaryIdentity.displayName ?? null,
        avatarUrl: primaryIdentity.avatarUrl ?? null,
        authProvider: primaryIdentity.provider as AuthProviderId,
        currentTeamId: user.currentTeamId ?? null,
      }
    }

    // The dashboard layouts gate onboarding on `session.team.onboardedStep`.
    // Nothing populated `session.team`, so that read threw
    // "Cannot read properties of undefined (reading 'onboardedStep')" and 500'd
    // the dashboard for every signed-in user.
    const currentTeam = user.currentTeamId
      ? await db.query.teams.findFirst({ where: eq(schema.teams.teamId, user.currentTeamId) }).catch(() => null)
      : null
    session.team = currentTeam
      ? {
          teamId: currentTeam.teamId,
          name: currentTeam.name,
          personalTeam: !!currentTeam.personalTeam,
          onboardedStep: currentTeam.onboardedStep ?? null,
        }
      : null

    session.apiKey = user.apiKey
    session.deliveryEmail = primaryIdentityEmail || user.email || null
    session.discordId = user.discordId
    session.discordUsername = user.discordUsername
    session.discordAvatar = user.discordAvatar
    session.discordRoleAssigned = user.discordRoleAssigned
    session.githubOrgInvited = user.githubOrgInvited
    session.gscConnected = !!user.gscConnected
    session.gscEmail = user.gscEmail
    session.googleScopes = user.googleScopes
    session.gscdumpUserId = user.gscdumpUserId
    // A gscdump user id alone does not make Search Console usable: every
    // browser query goes through the same-origin v1 proxy, which needs the
    // per-user API key too. Accounts registered before the callback persisted
    // that key have an id and no key, so the dashboard hid its "Connect"
    // prompt while every panel failed with `gscdump_api_key_missing`. This is
    // the same predicate `/api/pro/gscdump-integration` reports.
    session.gscdumpConnected = !!(user.gscdumpUserId && user.gscdumpApiKey)
    const toIso = (d: Date | null | undefined): string | null => {
      if (!d || Number.isNaN(d.getTime()))
        return null
      return d.toISOString()
    }
    session.monthlyReportEmail = !!user.monthlyReportEmail
    session.monthlyReportDiscord = !!user.monthlyReportDiscord
    session.monthlyReportDisabled = !!user.monthlyReportDisabled
    session.lastMonthlyReportAt = toIso(user.lastMonthlyReportAt)
    session.monthlyReportFailedAt = toIso(user.monthlyReportFailedAt)
    session.monthlyReportFailureReason = user.monthlyReportFailureReason
    session.reportScope = user.reportScope || 'all'
    session.onboardingCompletedAt = toIso(user.onboardingCompletedAt)

    const [hasMcpConnection, hasSites] = await Promise.all([
      user.currentTeamId
        ? db.query.mcpUsage.findFirst({
            where: and(
              eq(schema.mcpUsage.teamId, user.currentTeamId),
              eq(schema.mcpUsage.endpoint, 'mcp/pro'),
            ),
          }).then(r => !!r).catch(() => false)
        : Promise.resolve(false),
      // Sites are attached to a team through `team_sites`, not a `team_id`
      // column on `sites`. The previous read used `schema.sites.teamId`, which
      // does not exist: drizzle threw on every request and the catch below
      // turned that into a silent `hasSites: false` for every user.
      user.currentTeamId
        ? db.select({ siteId: teamSites.siteId })
            .from(teamSites)
            .where(eq(teamSites.teamId, user.currentTeamId))
            .limit(1)
            .then(rows => rows.length > 0)
            .catch((error: unknown) => {
              logger.error('[session] hasSites lookup failed:', error)
              return false
            })
        : Promise.resolve(false),
    ])

    session.hasMcpConnection = hasMcpConnection
    session.hasSites = hasSites
  })
})
