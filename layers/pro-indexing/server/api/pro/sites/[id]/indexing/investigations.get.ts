import { defineProApiHandler } from '#layers/pro-saas/server/utils/handler'

// TODO(v1): indexingInvestigations table not yet wired up in pro-saas/server/database.
export default defineProApiHandler({ site: true }, async () => {
  throw createError({ statusCode: 501, statusMessage: 'Not Implemented' })
})
