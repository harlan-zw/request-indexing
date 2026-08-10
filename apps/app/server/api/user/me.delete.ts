// TODO(v1): re-implement account deletion. The previous implementation relied
// on dropped User columns (loginTokens, indexingOAuthIdNext) and removed
// utilities (incrementMetric, clearUserStorage, OAuth2Client revoke).
export default defineEventHandler(() => {
  throw createError({ statusCode: 501, statusMessage: 'Not Implemented' })
})
