import { listTeamMembers } from '../../../../resources/team'
import { defineProApiHandler } from '../../../../utils/handler'

export default defineProApiHandler({ team: true }, async ({ team: ctx }) => {
  return await listTeamMembers(ctx)
})
