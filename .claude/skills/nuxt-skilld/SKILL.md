---
name: nuxt-skilld
description: "ALWAYS use when writing code importing \"nuxt\". Consult for debugging, best practices, or modifying nuxt."
metadata:
  version: 4.3.0
  generated_by: Claude Code · Haiku 4.5
  generated_at: 2026-03-03
---

# nuxt/nuxt `nuxt`

**Version:** 4.3.0 (Feb 2026)
**Deps:** @dxup/nuxt@^0.3.2, @nuxt/cli@^3.33.0, @nuxt/devtools@^3.1.1, @nuxt/telemetry@^2.7.0, @unhead/vue@^2.1.3, @vue/shared@^3.5.27, c12@^3.3.3, chokidar@^5.0.0, compatx@^0.2.0, consola@^3.4.2, cookie-es@^2.0.0, defu@^6.1.4, destr@^2.0.5, devalue@^5.6.2, errx@^0.1.0, escape-string-regexp@^5.0.0, exsolve@^1.0.8, h3@^1.15.5, hookable@^5.5.3, ignore@^7.0.5, impound@^1.0.0, jiti@^2.6.1, klona@^2.0.6, knitwork@^1.3.0, magic-string@^0.30.21, mlly@^1.8.0, nanotar@^0.2.0, nypm@^0.6.5, ofetch@^1.5.1, ohash@^2.0.11, on-change@^6.0.2, oxc-minify@^0.112.0, oxc-parser@^0.112.0, oxc-transform@^0.112.0, oxc-walker@^0.7.0, pathe@^2.0.3, perfect-debounce@^2.1.0, pkg-types@^2.3.0, rou3@^0.7.12, scule@^1.3.0, semver@^7.7.4, std-env@^3.10.0, tinyglobby@^0.2.15, ufo@^1.6.3, ultrahtml@^1.6.0, uncrypto@^0.1.3, unctx@^2.5.0, unimport@^5.6.0, unplugin@^3.0.0, unplugin-vue-router@^0.19.2, untyped@^2.0.0, vue@^3.5.27, vue-router@^4.6.4, @nuxt/kit@4.3.1, @nuxt/schema@4.3.1, @nuxt/vite-builder@4.3.1, @nuxt/nitro-server@4.3.1
**Tags:** 1x: 1.4.5 (Nov 2018), 2x: 2.18.1 (Jun 2024), alpha: 4.0.0-alpha.4 (Jun 2025), rc: 4.0.0-rc.0 (Jul 2025), latest: 4.3.1 (Feb 2026), 3x: 3.21.1 (Feb 2026)

**References:** [package.json](./.skilld/pkg/package.json) — exports, entry points • [README](./.skilld/pkg/README.md) — setup, basic usage • [Docs](./.skilld/docs/_INDEX.md) — API reference, guides • [GitHub Issues](./.skilld/issues/_INDEX.md) — bugs, workarounds, edge cases • [GitHub Discussions](./.skilld/discussions/_INDEX.md) — Q&A, patterns, recipes • [Releases](./.skilld/releases/_INDEX.md) — changelog, breaking changes, new APIs

## Search

Use `skilld search` instead of grepping `.skilld/` directories — hybrid semantic + keyword search across all indexed docs, issues, and releases. If `skilld` is unavailable, use `npx -y skilld search`.

```bash
skilld search "query" -p nuxt
skilld search "issues:error handling" -p nuxt
skilld search "releases:deprecated" -p nuxt
```

Filters: `docs:`, `issues:`, `releases:` prefix narrows by source type.

## API Changes

This section documents version-specific API changes for Nuxt v4.3.0 — prioritizing breaking changes, new APIs, and signature changes from recent major/minor releases.

- BREAKING: `statusCode` and `statusMessage` → `status` and `statusText` — v4.3.0 deprecates old properties in preparation for Nitro v3/H3 v2 alignment with Web API naming conventions. Use `createError({ status: 404, statusText: 'Not Found' })` instead of `statusCode`/`statusMessage`. Old properties still work but will be removed in v5 [source](./.skilld/releases/v4.3.0.md#deprecations)

- NEW: `appLayout` property in route rules — v4.3.0 adds declarative layout assignment per route rule, enabling centralized layout management without `definePageMeta` calls scattered throughout pages [source](./.skilld/releases/v4.3.0.md#route-rule-layouts)

- NEW: Route groups exposed in page meta — v4.3.0 exposes `meta.groups` on routes, making it easy to check which route groups (parentheses-wrapped folders) a page belongs to, useful for middleware-based authorization [source](./.skilld/releases/v4.3.0.md#route-groups-in-page-meta)

- NEW: `setPageLayout` accepts second parameter for layout props — v4.3.0 signature changed from `setPageLayout(name)` to `setPageLayout(name, props)`, allowing layout components to receive dynamic configuration [source](./.skilld/releases/v4.3.0.md#layout-props-with-setpagelayout)

- NEW: `#server` alias for clean server imports — v4.3.0 adds a new `#server` alias similar to `#shared`, eliminating relative path hell in server directories; includes import protection (cannot import `#server` from client context) [source](./.skilld/releases/v4.3.0.md#server-alias)

- NEW: Payload extraction for ISR/SWR and dev mode — v4.3.0 extends payload generation to ISR/SWR cached routes and dev mode (when `nitro.static` is true), enabling client-side navigation with cached payloads [source](./.skilld/releases/v4.3.0.md#isrswr-payload-extraction)

- NEW: Async plugin constructors for modules — v4.3.0 allows `addVitePlugin` and `addWebpackPlugin` to receive async functions for true lazy loading of build plugins, avoiding unnecessary code loading [source](./.skilld/releases/v4.3.0.md#async-plugin-constructors)

- NEW: `useAsyncData` with `AbortController` signal — v4.2.0 allows passing a `signal` parameter to the handler and `refresh()`/`execute()`, enabling fine-grained request cancellation [source](./.skilld/releases/v4.2.0.md#abort-control-for-data-fetching)

- BREAKING: Separate TypeScript projects for app/server/shared/node — v4.0.0 creates isolated `tsconfig.app.json`, `tsconfig.server.json`, `tsconfig.shared.json`, and `tsconfig.node.json` files instead of monolithic config; now requires single root `tsconfig.json` with references [source](./.skilld/releases/v4.0.0.md#better-typescript-experience)

- NEW: Module `moduleDependencies` with version constraints — v4.1.0 allows modules to declare dependencies, optional status, and configuration overrides/defaults, replacing deprecated `installModule` [source](./.skilld/releases/v4.1.0.md#module-dependencies-and-integration)

- NEW: Module lifecycle hooks `onInstall` and `onUpgrade` — v4.1.0 triggers these hooks when modules are first installed or upgraded (tracked in `.nuxtrc`), enabling setup wizards and migration logic [source](./.skilld/releases/v4.1.0.md#module-lifecycle-hooks)

- NEW: `getLayerDirectories` utility — v4.1.0 provides clean access to layer directories (`app`, `appPages`, `server`, `public`) without private API access; use this instead of `nuxt.options._layers` [source](./.skilld/releases/v4.1.0.md#layer-directories-utility)

- NEW: Import maps for chunk stability (`entryImportMap`) — v4.1.0 prevents cascading hash invalidation when components change; automatically enabled but can be disabled via `experimental.entryImportMap: false` [source](./.skilld/releases/v4.1.0.md#enhanced-chunk-stability)

- BREAKING: New `app/` directory structure — v4.0.0 moves application code to `app/` directory by default (components, pages, layouts, app.vue); backwards compatible if you keep old structure [source](./.skilld/releases/v4.0.0.md#new-project-structure)

**Also changed:** Experimental async data handler extraction (v4.2.0, bundle size reduction for static sites) · Experimental TypeScript plugin support (v4.2.0) · Vite Environment API opt-in (v4.2.0, experimental) · Component `declarationPath` (v4.2.0) · `setGlobalHead` utility (v4.2.0) · `resolveModule` with `extensions` option (v4.2.0) · Experimental Rolldown support (v4.1.0) · Lazy hydration macros without auto-imports (v4.1.0) · `resolveFiles` with `ignore` option (v4.1.0) · `#app/components/layout` → `#app/components/nuxt-layout` (v4.0.0, import path change) · Removed public and assets aliases (v4.0.0) · Removed top-level `generate` option (v4.0.0) · Better shared data fetching in useAsyncData/useFetch (v4.0.0)

## Nuxt v4.3.0 Best Practices

## Best Practices

- Fix hydration mismatches immediately — they cause performance degradation and broken interactivity by forcing Vue to re-render entire component trees [source](./.skilld/docs/3.guide/2.best-practices/hydration.md#why-is-it-important-to-fix-them)

- Wrap browser-only code with `<ClientOnly>` or move to `onMounted` — using browser APIs like `localStorage` in setup during SSR causes hydration mismatches [source](./.skilld/docs/3.guide/2.best-practices/hydration.md#browser-only-apis-in-server-context)

- Use `useFetch` and `useAsyncData` instead of `$fetch` in component setup — they prevent double-fetching by forwarding server-rendered data to client without refetching [source](./.skilld/docs/1.getting-started/10.data-fetching.md#the-need-for-usefetch-and-useasyncdata)

- Always provide an explicit key as the first argument to `useAsyncData` — auto-generated keys fail with custom composables wrapping the call [source](./.skilld/docs/1.getting-started/10.data-fetching.md#keys)

- Use `pick` and `transform` to minimize payload size transferred from server to client — reduces HTML document size and speeds hydration [source](./.skilld/docs/1.getting-started/10.data-fetching.md#minimize-payload-size)

- Defer async module logic to hooks (e.g., `onInstall`, `onUpgrade`) instead of module setup — prevents blocking the dev server and build process for time-consuming operations [source](./.skilld/docs/3.guide/4.modules/6.best-practices.md#handle-async-setup)

- Set `parallel: true` for async plugins to allow concurrent loading with other parallel plugins — improves hydration performance by preventing blocking operations [source](./.skilld/docs/3.guide/2.best-practices/plugins.md#if-async-enable-parallel)

- Use `useState` with `shallowRef` for large objects and arrays — improves performance by avoiding deep reactivity overhead on non-reactive state [source](./.skilld/docs/4.api/2.composables/use-state.md#using-shallowref)

- Call composables only in setup context: inside `<script setup>`, plugins, middleware, or `defineNuxtComponent` — using them outside these contexts throws "Nuxt instance is unavailable" error [source](./.skilld/docs/3.guide/1.concepts/3.auto-imports.md#vue-and-nuxt-composables)

- Use computed URLs or reactive `query` options to trigger auto-refetch on dependency changes — Nuxt automatically watches these and refetches without manual `watch` option [source](./.skilld/docs/1.getting-started/10.data-fetching.md#computed-url)
