// Pro GSC layer: Google Search Console domain. Owns gscdump.com integration,
// GSC sync and all search-console UI/data fetching.
// External coupling: gscdump.com's public v1 API (server utils and SDK).
//
// This layer opts OUT of contributing to global auto-import. Components and
// composables defined here MUST be imported explicitly (relative paths
// inside the layer, `~~/layers/pro-gsc/...` paths from outside). The
// string-resolved site-surface registration was migrated to a direct
// Component value (see `app/plugins/site-surface.ts`).

export default defineNuxtConfig({
  components: [],
  imports: {
    dirs: [],
  },
})
