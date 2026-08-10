import { invitationCreateSchema } from '../../../../../shared/validators/invitations'
import { inviteTeamMember } from '../../../../actions/team'
import { defineProApiHandler } from '../../../../utils/handler'

export default defineProApiHandler({
  team: { ability: 'manage-members' },
  body: invitationCreateSchema,
}, async ({ event, team: ctx, body }) => {
  return await inviteTeamMember(event, ctx, body)
})
