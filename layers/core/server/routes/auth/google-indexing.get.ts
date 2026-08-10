import { createError, defineEventHandler } from 'h3'

// TODO(v1): rework indexing OAuth scope-upgrade flow against new
// `googleAccounts` table (type='indexing'). The previous implementation
// referenced dropped `users.indexingOAuthIdNext`, `users.lastIndexingOAuthIdNext`,
// `getAuthenticatedData`, `updateUserToken`, `updateUser`, and `incrementMetric`.
export default defineEventHandler(() => {
  throw createError({
    statusCode: 501,
    statusMessage: 'V1 rework pending: indexing OAuth flow not yet reimplemented',
  })
})
