# Retired: Pro GSC browser DuckDB dual path

> Status: retired for the v1 cutover. `@gscdump/nuxt-analytics` was removed from
> the package train and this consumer no longer extends it. Current queries use
> explicit consumer-owned hosted operations; the material below is retained
> only as the historical design record.

## Request flow

```
Component (e.g. ProBrandTrafficChart.vue)
  └─ useProGscdumpData / DataDetail / Analysis / TableData (app/composables/useProGscdump.ts)
       │  - builds AnalysisParams (data-query, data-detail, or analyzer preset)
       │  - reads engine from useProBrowserAnalyzerFlag() ('auto' or 'server')
       └─ useGscQuery (layer)
            ├─ engine === 'server' → runServer
            ├─ engine === 'browser' → runBrowser
            └─ engine === 'auto' → runBrowser, on throw → runServer
                                     │
                                     ├─ runBrowser → useGscAnalyzer.analyze(params)
                                     │    │
                                     │    ├─ probe: GET /api/__gsc/sites/<id>/source-info  (gscdump.com)
                                     │    │   - returns browserAttachEligible boolean + supportedAnalyzerIds
                                     │    │   - Cache-Control: private, max-age=60
                                     │    │
                                     │    ├─ manifest: GET /api/__gsc/sites/<id>/analysis-sources  (gscdump.com)
                                     │    │   - returns { tables: { pages: [signedUrl, …], … }, manifestVersion }
                                     │    │   - signed URLs proxy to /api/r2-data/<key>?s=<bytes>.<sig>
                                     │    │   - rate-limited per-user (shares limiter with /api/r2-data/*)
                                     │    │
                                     │    ├─ DuckDB-WASM boots (cached after first site mount via pro-site-dashboard preload)
                                     │    ├─ attachParquetUrlTables(tables) — Range GETs to R2 proxy
                                     │    └─ analyzer.analyze() runs SQL in browser → AnalysisResult
                                     │
                                     └─ runServer → serverFallback(siteId, params)
                                          - composable-specific override (cloud GET/POST against gscdump.com Partner API)
                                          - data-query → /sites/<id>/data
                                          - data-detail → /sites/<id>/data/detail
                                          - analyzer preset → POST /sites/<id>/analysis
```

Telemetry: every browser→server fallback fires `reportFallback(reason)` from `useGscQuery`, beacon-flushed to `/api/telemetry/fallback` on both nuxtseo.com and gscdump.com.

Engine indicator (dev only): `ProGscEngineDevPill.client.vue` (mounted in `pro-dashboard.vue`) tracks `query.engine.value` for every `useProGscdump*` call via `trackGscEngine(query)` and renders a floating bottom-left pill with browser/server/fallback counts.

## Adding a new R2-aware composable

For any GSC-data composable that wants the dual-path:

1. Define the analyzer params shape (must be one of: `data-query`, `data-detail`, or an `AnalysisTool` preset like `brand`, `movers`, `striking-distance`, `opportunity`, `decay`, `zero-click`).
2. Call `useGscQuery<TConsumerShape>({ site, params, enabled, engine, reshape, serverFallback })`.
3. Provide `serverFallback` that hits the corresponding gscdump.com cloud endpoint with the existing query-string contract.
4. Provide `reshape(raw)` to project `AnalysisResult` (raw rows + meta) into the consumer-facing shape.
5. Pass `engine: useProBrowserAnalyzerFlag().engine.value` so the user's settings toggle is honored.
6. Call `trackGscEngine(query)` so the dev pill counts engine usage.

For composables backed by Google APIs that don't have parquet equivalents (sitemaps, indexing diagnostics, URL inspection), keep using `useGscdumpQuery` (the cloud-only `useAsyncData` factory at the bottom of `useProGscdump.ts`).

## How to opt a site into R2

R2 eligibility is decided server-side on gscdump.com:

- Site must be a paid/pro tier in gscdump.com's user table.
- Source provider must resolve to the `engine` source (or composite that includes engine).
- Parquet manifest must list at least one published partition for the site (manifest entries land via the sync pipeline).

The `__gsc/sites/<id>/source-info` endpoint returns `browserAttachEligible: true` once all three are satisfied. There is no client-side opt-in; the user's `browserAnalyzerEnabled` setting (toggled on `/pro/dashboard/account`) only controls whether eligible sites use the browser path or stay on cloud.

## SSR-only callers (must stay cloud)

`server/utils/gscdump-client.ts` and every `layers/nuxt-seo-pro/server/api/**` consumer of `useGscdumpClient()` runs on Cloudflare Workers — no DuckDB-WASM. These intentionally bypass the layer and hit `https://gscdump.com/api/*` directly:

- `gsc-properties.get.ts`, `gsc-sync.post.ts`, `gsc-disconnect-site.post.ts`, `gsc-resync.post.ts`
- `sites/validate.post.ts`, `sites/bulk.post.ts`, `sites/[id]/analysis.get.ts`, `sites/[id]/lighthouse/seed.post.ts`
- `public/portfolio.get.ts`, `public/demo/*.get.ts`
- `server/utils/auto-link-gsc.ts`, `server/utils/build-monthly-report.ts`

If you add a new SSR endpoint that needs GSC data, use `useGscdumpClient()` — never reach for the analytics layer composables.

## Local dev

The layer's `apiBase` defaults to `https://gscdump.com`. To point at a local gscdump.com instance, set `NUXT_PUBLIC_ANALYTICS_API_BASE` before starting Nuxt. The root app also accepts `GSCDUMP_ANALYTICS_API_BASE` as a server-side build-time fallback.

The auth-header race is handled by `00.gscdump-analytics.client.ts` (enforce: 'pre'), which fetches credentials from `/api/pro/me/gscdump-credentials` and calls `setGscFetchHeaders` before any composable boots. Subsequent `useGscFetch()` calls automatically carry `x-api-key`.
