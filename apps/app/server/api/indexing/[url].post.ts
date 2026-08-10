import { createError, defineEventHandler } from 'h3'

// TODO(v1): rework indexing submission against new `googleAccounts` table
// (type='indexing') and the V1 `indexingJobs` queue. The previous implementation
// referenced dropped `users.indexingOAuthId`, snake_case oauth pool fields,
// removed `getUserToken` / `updateUserSite` helpers.
export default defineEventHandler(() => {
  throw createError({
    statusCode: 501,
    statusMessage: 'V1 rework pending: indexing submission not yet reimplemented',
  })
})
