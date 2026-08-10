// TODO(v1): Re-implement via `useGscdumpClient().getData(siteId, { dimensions:
// ['country'], filter: between(date, ...) })`. v0 read from
// `siteDateCountryAnalytics`; gscdump's `country` dimension returns alpha-3
// codes that map through `~~/layers/core/server/data/countries`. Dashboard
// contract: paginated rows + previous-period diff. Filters (new/lost/improving)
// can layer on top via the comparison query.
export default defineEventHandler(() => {
  throw createError({ statusCode: 501, statusMessage: 'V1 rework pending: countries endpoint deferred to gscdump-backed dashboard.' })
})
