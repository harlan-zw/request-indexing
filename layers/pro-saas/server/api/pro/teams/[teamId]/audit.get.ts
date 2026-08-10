import { z } from 'zod'
import { listTeamAuditEvents } from '../../../../resources/team'
import { defineProApiHandler } from '../../../../utils/handler'

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
})

export default defineProApiHandler({ team: true }, async ({ event, team: ctx }) => {
  const { limit } = await getValidatedQuery(event, querySchema.parse)
  return { events: await listTeamAuditEvents(ctx, limit) }
})
