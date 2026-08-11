import { deleteAccount } from '#layers/pro-saas/server/actions/account'
import { defineProApiHandler } from '#layers/pro-saas/server/utils/handler'
import { deleteAccountBodySchema } from '#layers/pro-saas/shared/validators/account'

// Account deletion. `deleteAccount` -> `deleteUserData` already fires the
// `pro:user:deleting` / `pro:user:deleted` hooks (gscdump purge, Stripe
// cancel, etc listen there); this route only wires the caller + response.
export default defineProApiHandler({
  body: deleteAccountBodySchema,
}, async ({ event, db, caller, body }) => {
  const result = await deleteAccount(event, { db, userId: caller.user.id, feedback: body?.feedback })

  // Always clear the cookie regardless of partial-failure state; the user
  // asked to leave, even if some downstream cleanup didn't land.
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
