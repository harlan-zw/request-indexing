// TODO(v1): Re-implement on top of `useGscdumpClient().getData()` with a typed
// query builder (`@gscdump/sdk/query` — `query`/`page` columns + `between(date,
// ...)` filter). The v0 implementation glued drizzle column refs into the
// gscdump builder, which has a different column brand → ~40 TS errors.
// Dashboard contract: { rows, total, totalClicks } per-keyword aggregate over
// userPeriodRange with prev-period diffs and optional top-pages join. The
// gscdump analysis presets (`movers-*`, `striking-distance`, `opportunity`)
// already cover the filter modes; keep the table thin and delegate to those.
export default defineEventHandler(() => {
  throw createError({ statusCode: 501, statusMessage: 'V1 rework pending: keywords endpoint deferred to gscdump-backed dashboard.' })
})
