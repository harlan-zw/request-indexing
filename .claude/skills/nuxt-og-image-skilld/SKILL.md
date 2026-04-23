---
name: nuxt-og-image-skilld
description: "ALWAYS use when writing code importing \"nuxt-og-image\". Consult for debugging, best practices, or modifying nuxt-og-image, nuxt og image, og-image, og image."
metadata:
  version: 6.0.0-beta.46
  generated_by: Claude Code · Haiku 4.5
  generated_at: 2026-03-03
---

# nuxt-modules/og-image `nuxt-og-image`

**Version:** 6.0.0-beta.46 (Mar 2026)
**Deps:** @clack/prompts@^1.0.1, @nuxt/devtools-kit@^3.2.2, @nuxt/kit@^4.3.1, @vue/compiler-sfc@^3.5.29, chrome-launcher@^1.2.1, consola@^3.4.2, culori@^4.0.2, defu@^6.1.4, devalue@^5.6.3, exsolve@^1.0.8, lightningcss@^1.31.1, magic-string@^0.30.21, magicast@^0.5.2, mocked-exports@^0.1.1, nuxt-site-config@^3.2.21, nypm@^0.6.5, ofetch@^1.5.1, ohash@^2.0.11, pathe@^2.0.3, pkg-types@^2.3.0, radix3@^1.1.2, sirv@^3.0.2, std-env@^3.10.0, strip-literal@^3.1.0, tinyexec@^1.0.2, tinyglobby@^0.2.15, ufo@^1.6.3, ultrahtml@^1.6.0, unplugin@^3.0.0
**Tags:** latest: 5.1.13 (Dec 2025), beta: 6.0.0-beta.46 (Mar 2026)

**References:** [package.json](./.skilld/pkg/package.json) — exports, entry points • [README](./.skilld/pkg/README.md) — setup, basic usage • [Docs](./.skilld/docs/_INDEX.md) — API reference, guides • [GitHub Issues](./.skilld/issues/_INDEX.md) — bugs, workarounds, edge cases • [Releases](./.skilld/releases/_INDEX.md) — changelog, breaking changes, new APIs

## Search

Use `skilld search` instead of grepping `.skilld/` directories — hybrid semantic + keyword search across all indexed docs, issues, and releases. If `skilld` is unavailable, use `npx -y skilld search`.

```bash
skilld search "query" -p nuxt-og-image
skilld search "issues:error handling" -p nuxt-og-image
skilld search "releases:deprecated" -p nuxt-og-image
```

Filters: `docs:`, `issues:`, `releases:` prefix narrows by source type.

## API Changes

This section documents version-specific API changes — prioritize recent major/minor releases.

## v6.0.0 API Changes

### Breaking Changes (v5 → v6)

- BREAKING: `<OgImage>` and `<OgImageScreenshot>` Vue components removed — use `defineOgImage()` and `defineOgImageScreenshot()` composables instead [source](./.skilld/docs/content/6.migration-guide/v6.md:L173:195)

- BREAKING: `defineOgImageComponent()` deprecated — use `defineOgImage(component, props, options)` instead with component name as first argument [source](./.skilld/docs/content/4.api/0.define-og-image-component.md:L6:14)

- BREAKING: Component renderer suffix now required — rename `components/OgImage/MyTemplate.vue` to `MyTemplate.takumi.vue`, `MyTemplate.satori.vue`, or `MyTemplate.browser.vue` based on renderer [source](./.skilld/docs/content/6.migration-guide/v6.md:L69:95)

- BREAKING: Renderer dependencies no longer bundled — explicitly install `@takumi-rs/core` (Node.js) or `@takumi-rs/wasm` (Edge), `satori` + `@resvg/resvg-js`, or `playwright-core` based on your renderer choice [source](./.skilld/docs/content/6.migration-guide/v6.md:L35:67)

- BREAKING: `ogImage.fonts` config removed — use `@nuxt/fonts` module instead; Inter (400, 700) bundled as zero-config fallback [source](./.skilld/docs/content/6.migration-guide/v6.md:L138:165)

- BREAKING: `ogImage.componentOptions` config removed — components are no longer registered globally [source](./.skilld/docs/content/6.migration-guide/v6.md:L199:209)

- BREAKING: `defaults.renderer` and `renderer` option on `defineOgImage()` removed — renderer determined by component filename suffix only [source](./.skilld/docs/content/6.migration-guide/v6.md:L108:110)

- BREAKING: OG Image URL paths changed from `/__og-image__/*` to `/_og/*` with new Cloudinary-style encoding; query params no longer in cache key by default [source](./.skilld/docs/content/6.migration-guide/v6.md:L325:372)

- BREAKING: `chromium` renderer renamed to `browser` — update component suffixes and config options [source](./.skilld/docs/content/6.migration-guide/v6.md:L420:442)

- BREAKING: `browser: 'node'` compatibility option removed — use `browser: 'playwright'` instead [source](./.skilld/docs/content/6.migration-guide/v6.md:L444:459)

- BREAKING: Nuxt Content v2 support removed — upgrade to Nuxt Content v3 and use `defineOgImage()` in page components [source](./.skilld/docs/content/6.migration-guide/v6.md:L388:402)

### New Features (v6)

- NEW: `defineOgImage()` first-argument component syntax — `defineOgImage('MyComponent', props, options)` replaces `defineOgImageComponent()` [source](./.skilld/docs/content/4.api/0.define-og-image.md:L14:30)

- NEW: Multiple OG images per page via `key` parameter — generate different dimensions for different platforms (e.g., 1200x600 for Twitter, 800x800 for WhatsApp) [source](./.skilld/docs/content/4.api/0.define-og-image.md:L117:137)

- NEW: Takumi renderer as recommended option — 2-10x faster than Satori with comprehensive CSS support and default 2x DPI for crisp images [source](./.skilld/docs/content/6.migration-guide/v6.md:L24)

- NEW: Renderer-specific component variants — create `MyTemplate.satori.vue` and `MyTemplate.takumi.vue` in same directory for multiple renderer implementations [source](./.skilld/docs/content/6.migration-guide/v6.md:L96:106)

- NEW: `@nuxt/fonts` integration — custom fonts work automatically when module installed; Inter bundled as zero-config default [source](./.skilld/docs/content/6.migration-guide/v6.md:L156:165)

- NEW: First-class CSS support — Tailwind v4 with `@theme`, UnoCSS, CSS variables, and Nuxt UI v3 semantic colors all just work out-of-box [source](./.skilld/docs/content/6.migration-guide/v6.md:L224:282)

- NEW: `cacheQueryParams` config option — restore v5 behavior of including query params in cache keys [source](./.skilld/docs/content/6.migration-guide/v6.md:L294:302)

- NEW: `cacheVersion` config option — controls cache key namespacing and allows manual cache invalidation [source](./.skilld/docs/content/6.migration-guide/v6.md:L312:323)

- NEW: `getOgImagePath()` utility (auto-imported) — programmatically get OG image URLs instead of hardcoding them [source](./.skilld/docs/content/6.migration-guide/v6.md:L374:386)

- NEW: Cloudflare Browser Rendering support — use `provider: 'cloudflare', binding: 'BROWSER'` in config for runtime screenshots on Cloudflare [source](./.skilld/docs/content/6.migration-guide/v6.md:L462:476)

### Import Path Changes (v6)

- BREAKING: `#nuxt-og-image-utils` alias removed — use `#og-image/shared` instead [source](./.skilld/docs/content/6.migration-guide/v6.md:L482:489)

- BREAKING: `useOgImageRuntimeConfig` import path changed — import from `#og-image/app/utils` not `#og-image/shared` [source](./.skilld/docs/content/6.migration-guide/v6.md:L491:498)

### Configuration Options Removed (v6)

- BREAKING: `strictNuxtContentPaths` config removed — this option had no effect in Nuxt Content v3 [source](./.skilld/docs/content/6.migration-guide/v6.md:L408:418)

Also changed: Community templates must be ejected before production builds · Hash mode URLs for prerendering with long options · Sharp JPEG errors now throw instead of silent fallback · `defineOgImage()` now returns array of generated paths

## Best Practices

- Use **Takumi renderer** by default — 2-10x faster than Satori with comprehensive CSS support including gradients, shadows, opacity, CSS Grid, transforms, and filters [source](./.skilld/docs/content/2.renderers/0.index.md#use-takumi-recommended)

- Name OG image components with **renderer suffix** (e.g., `MyTemplate.takumi.vue`) — enables automatic renderer detection, tree-shaking of unused code, and supports multiple renderer variants of the same component [source](./.skilld/docs/content/6.migration-guide/v6.md#component-renderer-suffix-required)

- Enable **`zeroRuntime`** for prerendered-only apps — removes 81% of Nitro renderer code from production bundle when all OG images are generated at build time [source](./.skilld/docs/content/3.guides/1.zero-runtime.md#usage)

- Persist **`runtimeCacheStorage`** with Redis or KV bindings in production — default memory cache clears on server restart; configure via Nitro plugin for environment-specific connection details [source](./.skilld/docs/content/3.guides/3.cache.md#runtime-cache-storage)

- Enable **`buildCache`** in CI/CD pipelines — caches rendered images between deployments to skip regeneration of identical content; configure GitHub Actions or GitLab CI to persist the cache directory [source](./.skilld/docs/content/3.guides/3.cache.md#build-cache-ci-persistence)

- Configure custom fonts **only via `@nuxt/fonts`** with `global: true` — manual CSS `@font-face` or CDN links do not work in OG image renderers; Inter (400, 700) is bundled as fallback [source](./.skilld/docs/content/3.guides/5.custom-fonts.md#setup)

- Use **props-based pattern for i18n** — resolve translations at page level and pass as props rather than using `useI18n()` inside OG components; components render in isolated server context without locale context [source](./.skilld/docs/content/4.integrations/3.i18n.md#pattern-1-props-based-recommended)

- Create **multiple OG images with shared props** — pass shared props as second argument and size/key variants as third array to reduce duplication across Twitter, Facebook, WhatsApp sizes [source](./.skilld/docs/content/4.api/0.define-og-image.md#shared-props-with-variants-recommended)

- Avoid **wildcard route rules with caching** — patterns like `'/**'` with `swr`/`isr`/`cache` break OG image routes; use specific patterns like `'/blog/**'` instead [source](./.skilld/docs/content/3.guides/2.route-rules.md#wildcard-route-rules-warning)
