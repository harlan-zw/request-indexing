// TODO(v1): Site-preview/list deferred. v0 read sites + completed-job counts
// for the user's team to show in-flight ingestion. v1 surfaces gscdump sync
// status via `useGscdumpClient().getUserLifecycle()` instead.
export default defineEventHandler(() => {
  throw createError({ statusCode: 501, statusMessage: 'V1 rework pending: sites/preview endpoint deferred to gscdump lifecycle.' })
})
