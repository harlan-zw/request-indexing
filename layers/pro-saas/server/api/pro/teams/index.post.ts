import { teamCreateSchema } from '../../../../shared/validators/teams'
import { createTeam } from '../../../actions/team'
import { defineProApiHandler } from '../../../utils/handler'

export default defineProApiHandler({
  body: teamCreateSchema,
}, async ({ event, db, caller, body }) => {
  const team = await createTeam(event, db, caller, body)
  return { team }
})
