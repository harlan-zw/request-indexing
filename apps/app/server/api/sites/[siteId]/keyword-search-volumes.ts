// TODO(v1): Search-volume enrichment is owned by gscdump's analysis presets
// (`searchVolume`/`difficulty`/`cpc` are populated on `GscdumpDataRow`). v0
// kept a local `keywords` enrichment cache + dataforseo job; in v1 this is a
// pass-through to `getData` or `getAnalysis`.
export default defineEventHandler(() => {
  throw createError({ statusCode: 501, statusMessage: 'V1 rework pending: keyword-search-volumes endpoint deferred to gscdump enrichment.' })
})
