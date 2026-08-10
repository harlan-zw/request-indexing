import { z } from 'zod'
import { createTeamApiToken } from '../../../../../actions/team'
import { defineProApiHandler } from '../../../../../utils/handler'

const bodySchema = z.object({
  label: z.string().trim().min(1).max(80).optional(),
  role: z.enum(['admin', 'editor', 'viewer']),
  expiresAt: z.string().datetime().optional(),
})

export default defineProApiHandler({
  team: true,
  body: bodySchema,
}, async ({ team: ctx, body }) => {
  const { plaintext, record } = await createTeamApiToken(ctx, body)
  return {
    token: plaintext,
    record,
  }
})
