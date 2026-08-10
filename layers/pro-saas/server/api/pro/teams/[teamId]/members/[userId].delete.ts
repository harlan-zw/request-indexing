import { ProError } from '../../../../../../shared/errors'
import { removeTeamMember } from '../../../../../actions/team'
import { defineProApiHandler } from '../../../../../utils/handler'

/**
 * Remove a team member. Two flows share this endpoint:
 *  - Admin removes someone else: requires `manage-members`.
 *  - Self-leave: any member can remove themselves; owner cannot leave (must transfer first).
 */
export default defineProApiHandler({}, async ({ event, caller }) => {
  const targetUserIdParam = getRouterParam(event, 'userId')
  const targetUserId = Number(targetUserIdParam)
  if (!targetUserIdParam || !Number.isFinite(targetUserId))
    throw new ProError('validation_failed', { message: 'Missing userId' })

  const isSelfLeave = targetUserId === caller.user.id

  // Self-leave can skip the manage-members ability gate, but still needs team access.
  const ctx = isSelfLeave
    ? await requireCurrentTeam(event)
    : await requireCurrentTeam(event, { ability: 'manage-members' })

  await removeTeamMember(event, ctx, targetUserId)
  return { ok: true }
})
