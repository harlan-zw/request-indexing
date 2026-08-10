import { listTeamApiTokens } from '../../../../../resources/team'
import { defineProApiHandler } from '../../../../../utils/handler'

export default defineProApiHandler({ team: true }, async ({ team: ctx }) => {
  return {
    tokens: await listTeamApiTokens(ctx),
  }
})
