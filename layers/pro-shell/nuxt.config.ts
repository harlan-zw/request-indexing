// Pro Shell layer: owns the page-flow primitive (ProSiteFeaturePage),
// the feature/policy/state-resolver/adapter registry, and the route-level
// gating middleware that pro-* feature layers contribute to.
//
// Pro-* layers extend this layer and register features via the
// `pro-shell:extend` Nuxt hook (see modules/pro-shell.ts).

export default {
  // modules/pro-shell.ts is auto-discovered by Nuxt from this layer's
  // modules/ directory.
  experimental: {
    // Eager scan so custom meta is on page.meta during pages:extend
    // (default 'after-resolve' fires too late for our hook).
    scanPageMeta: true,
    // Allowlist `proTab` for static extraction from definePageMeta.
    // Without this, custom keys land in __nuxt_dynamic_meta_key and are
    // invisible at build time.
    extraPageMetaExtractionKeys: ['proTab', 'pro'],
  },
}
