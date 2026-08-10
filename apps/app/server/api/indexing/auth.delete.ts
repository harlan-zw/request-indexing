import { createError, defineEventHandler } from 'h3'

// TODO(v1): rework indexing OAuth disconnect against new `googleAccounts`
// table (type='indexing'). The previous implementation referenced dropped
// `users.indexingOAuthIdNext`, removed `pool.release()`, `getUserToken` and
// `deleteUserToken` helpers.
export default defineEventHandler(() => {
  throw createError({
    statusCode: 501,
    statusMessage: 'V1 rework pending: indexing OAuth disconnect not yet reimplemented',
  })
})
