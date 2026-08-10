import { ProError } from '../../../../../../shared/errors'
import { teamMemberRoleUpdateSchema } from '../../../../../../shared/validators/teams'
import { updateTeamMemberRole } from '../../../../../actions/team'
import { defineProApiHandler } from '../../../../../utils/handler'

/**
 * Change a team member's role. Owner has no membership row, so role changes
 * for the owner are a no-op error (use transfer-ownership instead).
 */
export default defineProApiHandler({
  team: { ability: 'manage-members' },
  body: teamMemberRoleUpdateSchema,
}, async ({ event, team: ctx, body }) => {
  const targetUserIdParam = getRouterParam(event, 'userId')
  const targetUserId = Number(targetUserIdParam)
  if (!targetUserIdParam || !Number.isFinite(targetUserId))
    throw new ProError('validation_failed', { message: 'Missing userId' })

  return { membership: await updateTeamMemberRole(event, ctx, targetUserId, body) }
})
