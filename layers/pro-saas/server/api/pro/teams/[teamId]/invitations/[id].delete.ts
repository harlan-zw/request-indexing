import { ProError } from '../../../../../../shared/errors'
import { revokeTeamInvitation } from '../../../../../actions/team'
import { defineProApiHandler } from '../../../../../utils/handler'

export default defineProApiHandler({
  team: { ability: 'manage-members' },
}, async ({ event, team: ctx }) => {
  const idParam = getRouterParam(event, 'id')
  const id = Number(idParam)
  if (!idParam || !Number.isFinite(id))
    throw new ProError('validation_failed', { message: 'Missing invitation id' })
  await revokeTeamInvitation(ctx, id)
  return { ok: true }
})
