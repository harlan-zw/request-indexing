import { listPendingTeamInvitations } from '../../../../resources/team'
import { defineProApiHandler } from '../../../../utils/handler'

export default defineProApiHandler({ team: true }, async ({ team: ctx }) => {
  return {
    invitations: await listPendingTeamInvitations(ctx),
  }
})
