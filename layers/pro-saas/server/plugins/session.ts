import type { AuthProviderId } from '#layers/pro-saas-auth/shared/types/auth'
import { and, desc, eq } from 'drizzle-orm'
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
          email: primary?.email ?? impersonatedUser.stripeEmail ?? null,
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
      where: eq(schema.userIdentities.userId, user.id),
      orderBy: [desc(schema.userIdentities.lastUsedAt)],
    }).catch(() => [])
    const primaryIdentity = allIdentities[0] ?? null
    const primaryIdentityEmail = primaryIdentity?.email ?? null

    if (primaryIdentity) {
      session.user = {
        id: user.id,
        email: primaryIdentity.email ?? user.stripeEmail ?? null,
        name: primaryIdentity.displayName ?? null,
        avatarUrl: primaryIdentity.avatarUrl ?? null,
        authProvider: primaryIdentity.provider as AuthProviderId,
        currentTeamId: user.currentTeamId ?? null,
      }
    }

    session.apiKey = user.apiKey
    session.subscriptionStatus = user.subscriptionStatus
    session.subscriptionTier = user.subscriptionTier
    session.billingCycle = user.billingCycle
    session.sitesLimit = user.sitesLimit
    session.cancelAtPeriodEnd = !!user.cancelAtPeriodEnd
    session.stripeCustomerId = user.stripeCustomerId
    session.stripeEmail = user.stripeEmail
    session.deliveryEmail = primaryIdentityEmail || user.stripeEmail || null
    session.discordId = user.discordId
    session.discordUsername = user.discordUsername
    session.discordAvatar = user.discordAvatar
    session.discordRoleAssigned = user.discordRoleAssigned
    session.githubOrgInvited = user.githubOrgInvited
    session.gscConnected = !!user.gscConnected
    session.gscEmail = user.gscEmail
    session.googleScopes = user.googleScopes
    session.gscdumpUserId = user.gscdumpUserId
    const toIso = (d: Date | null | undefined): string | null => {
      if (!d || Number.isNaN(d.getTime()))
        return null
      return d.toISOString()
    }
    session.trialEndsAt = toIso(user.trialEndsAt)
    session.currentPeriodStart = toIso(user.currentPeriodStart)
    session.currentPeriodEnd = toIso(user.currentPeriodEnd)
    session.readOnlyUntil = toIso(user.readOnlyUntil)
    session.archivedAt = toIso(user.archivedAt)
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
      user.currentTeamId
        ? db.query.sites.findFirst({
            where: eq(schema.sites.teamId, user.currentTeamId),
          }).then(r => !!r).catch(() => false)
        : Promise.resolve(false),
    ])

    session.hasMcpConnection = hasMcpConnection
    session.hasSites = hasSites
  })
})
