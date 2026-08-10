import { z } from 'zod'
import { transferTeamOwnership } from '../../../../actions/team'
import { defineProApiHandler } from '../../../../utils/handler'

const bodySchema = z.object({
  newOwnerId: z.number(),
})

/**
 * Transfer team ownership to another user. Owner-only.
 *
 * Requires the new owner to already be a `team_memberships` row for the team
 * (you cannot transfer to a stranger). The previous owner becomes `admin` —
 * fixes Jetstream's known gotcha of leaving the ex-owner with no membership row.
 *
 * Refuses on personal teams.
 */
export default defineProApiHandler({
  team: { ability: 'transfer-ownership' },
  body: bodySchema,
}, async ({ team: ctx, body }) => {
  await transferTeamOwnership(ctx, body.newOwnerId)
  return { ok: true }
})
