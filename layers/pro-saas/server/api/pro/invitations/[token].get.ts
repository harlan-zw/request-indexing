import { eq } from 'drizzle-orm'
import { getPrimaryIdentity } from '#layers/pro-saas-auth/server/utils/auth/identity'
import { ProError } from '../../../../shared/errors'
import { teamInvitations, teams, users } from '../../../database'
import { defineProApiHandler } from '../../../utils/handler'

/**
 * Public preview of a pending invitation. Returns enough for the accept page
 * to render team name, inviter, role, and the three terminal states:
 *  - valid (T3.1)
 *  - expired (T3.2)
 *  - wrong-account (T3.3) — discriminated client-side using session vs invite.email.
 *
 * No auth required; anyone with the token gets the preview.
 */
export default defineProApiHandler({ caller: false }, async ({ event, db }) => {
  const token = getRouterParam(event, 'token')
  if (!token)
    throw new ProError('validation_failed', { message: 'Missing token' })
  const invitation = await db
    .select({
      id: teamInvitations.teamInvitationId,
      email: teamInvitations.email,
      role: teamInvitations.role,
      expiresAt: teamInvitations.expiresAt,
      acceptedAt: teamInvitations.acceptedAt,
      team: { id: teams.teamId, name: teams.name, personalTeam: teams.personalTeam },
      invitedBy: {
        id: users.userId,
      },
    })
    .from(teamInvitations)
    .innerJoin(teams, eq(teams.teamId, teamInvitations.teamId))
    .innerJoin(users, eq(users.userId, teamInvitations.invitedById))
    .where(eq(teamInvitations.token, token))
    .get()

  if (!invitation)
    throw new ProError('not_found', { message: 'Invitation not found' })

  const expired = !!invitation.expiresAt && invitation.expiresAt.getTime() < Date.now()
  const accepted = !!invitation.acceptedAt

  const inviterIdentity = await getPrimaryIdentity(db, invitation.invitedBy.id)

  return {
    invitation: {
      ...invitation,
      invitedBy: {
        ...invitation.invitedBy,
        name: inviterIdentity?.displayName ?? null,
        email: inviterIdentity?.email ?? null,
      },
      expired,
      accepted,
    },
  }
})
