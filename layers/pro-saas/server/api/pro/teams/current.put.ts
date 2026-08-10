import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { findMembership } from '#layers/pro-saas/shared/caller-policy'
import { ProError } from '../../../../shared/errors'
import { users } from '../../../database'
import { defineProApiHandler } from '../../../utils/handler'

const bodySchema = z.object({
  teamId: z.number(),
})

export default defineProApiHandler({
  body: bodySchema,
}, async ({ event, db, caller, body }) => {
  const { teamId } = body
  const target = findMembership(caller, teamId)
  if (!target)
    throw new ProError('membership_required', { message: 'Not a member of that team' })

  await db.update(users)
    .set({ currentTeamId: teamId, updatedAt: Date.now() })
    .where(eq(users.userId, caller.user.id))

  // Cookie carries the selection as a fast first-paint hint only; the
  // authoritative answer comes from the next /api/pro/caller resolution.

  const existing = await getUserSession(event)
  if (existing.user) {
    await setUserSession(event, {
      user: { ...existing.user, currentTeamId: teamId },
    })
  }

  return {
    currentTeam: {
      id: target.teamId,
      name: target.teamName,
      role: target.role,
      isOwner: target.isOwner,
      personalTeam: target.isPersonal,
    },
  }
})
