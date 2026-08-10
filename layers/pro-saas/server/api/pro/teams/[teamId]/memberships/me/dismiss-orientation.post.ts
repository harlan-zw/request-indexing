import { and, eq } from 'drizzle-orm'
import { ProError } from '../../../../../../../shared/errors'
import { teamMemberships } from '../../../../../../database'
import { defineProApiHandler } from '../../../../../../utils/handler'

export default defineProApiHandler({ team: true }, async ({ team: { db, team, caller, isOwner } }) => {
  if (isOwner)
    throw new ProError('not_found', { message: 'No membership row to dismiss' })

  const now = new Date()
  const updated = await db
    .update(teamMemberships)
    .set({ firstVisitDismissedAt: now, updatedAt: now })
    .where(and(
      eq(teamMemberships.teamId, team.teamId),
      eq(teamMemberships.userId, caller.user.id),
    ))
    .returning()
    .get()

  if (!updated)
    throw createError({ statusCode: 404, message: 'No membership row to dismiss' })

  return {
    membership: {
      firstVisitDismissedAt: updated.firstVisitDismissedAt?.toISOString() ?? null,
    },
  }
})
