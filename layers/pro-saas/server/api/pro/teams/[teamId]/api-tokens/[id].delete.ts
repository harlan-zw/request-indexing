import { ProError } from '../../../../../../shared/errors'
import { revokeTeamApiToken } from '../../../../../actions/team'
import { defineProApiHandler } from '../../../../../utils/handler'

export default defineProApiHandler({ team: true }, async ({ event, team: ctx }) => {
  const idParam = getRouterParam(event, 'id')
  const id = Number(idParam)
  if (!idParam || !Number.isFinite(id))
    throw new ProError('validation_failed', { message: 'Missing token id' })

  await revokeTeamApiToken(ctx, id)
  return { ok: true }
})
