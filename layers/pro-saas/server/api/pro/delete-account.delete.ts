import { deleteAccount } from '../../actions/account'
import { defineProApiHandler } from '../../utils/handler'

export default defineProApiHandler({}, async ({ event, db, caller }) => {
  const body = await readBody<{
    feedback?: {
      reasons?: unknown[]
      comment?: unknown
    }
  }>(event).catch(() => null)

  const result = await deleteAccount(event, { db, userId: caller.user.id, feedback: body?.feedback })

  // Always clear the cookie regardless of partial-failure state — the user asked
  // to leave, even if some downstream cleanup didn't land.
  await clearUserSession(event)

  if (!result.ok) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Account deletion did not complete',
      data: {
        deleted: result.deleted,
        warnings: result.warnings,
      },
    })
  }

  return {
    success: true,
    deleted: result.deleted,
    warnings: result.warnings,
  }
})
