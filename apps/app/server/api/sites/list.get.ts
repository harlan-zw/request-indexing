// TODO(v1): Sites list deferred. v0 read `sites` + `userSites` + page-count
// rollups; v1 should list `team_sites` (pro-saas) joined with gscdump lifecycle
// for sync status.
export default defineEventHandler(() => {
  throw createError({ statusCode: 501, statusMessage: 'V1 rework pending: sites/list endpoint deferred to team-scoped listing.' })
})
