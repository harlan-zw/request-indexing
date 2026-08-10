import { teamUpdateSchema } from '../../../../shared/validators/teams'
import { updateTeamName } from '../../../actions/team'
import { defineProApiHandler } from '../../../utils/handler'

export default defineProApiHandler({
  team: { ability: 'manage-team' },
  body: teamUpdateSchema,
}, async ({ event, team: ctx, body }) => {
  await updateTeamName(event, ctx, body)
  return { ok: true }
})
