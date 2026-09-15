import { join } from 'node:path'
import { defineNuxtConfig } from 'nuxt/config'
import { iconAliasMap, iconBundleList } from './shared/icons'
import { UI_ICON_SLOTS } from './shared/icons/ui-slots'

const currentDir = import.meta.dirname

// Register every semantic icon role (and its synonym aliases) as a global @nuxt/icon
// alias, generated from the registry for the active set. Role names then resolve
// EVERYWHERE — raw Nuxt UI components (`<UButton icon="next">`), data-array `icon:`
// fields, `<Icon name="next">`, content, app.config slots, AND our UiIcon/UiButton
// (which pass the name straight through). Because resolution happens here at build time,
// the role registry never ships to the client runtime. Swapping ACTIVE_ICON_SET
// regenerates the map on restart (config-theming over wrappers, per DESIGN.md). Values
// MUST be `prefix:name` (not `i-...`): @nuxt/icon re-prefixes an alias target with `i-`,
// so an `i-` value becomes a broken `i-i-...`. iconAliasMap handles that + synonyms.
const iconAliases = iconAliasMap()

// Design system layer: design language extended by every app — UI primitives, tokens,
// fonts, motion, chart helpers, formatters and design vocabularies. No domain logic.
//
// Kept structurally identical to nuxtseo.com's layer so the next resync is a diff, not a
// port. Brand-level values (colours, fonts, the `pro` colour) are the deliberate
// divergence; see DESIGN.md.

export default defineNuxtConfig({
  // Every file in this layer imports explicitly, as nuxtseo.com does. A layer cannot
  // scope this to itself: Nuxt merges layer config into one graph, so the root config
  // sets `imports.autoImport: true` again and the rest of the app keeps auto-imports.
  imports: { autoImport: false },

  nitro: {
    imports: { autoImport: false },
    alias: {
      // `@nuxt/image@2.1.0` reaches `useRuntimeConfig` through `nitro/runtime-config` —
      // the nitro v3 package — in `runtime/server/routes/_ipx.js` and
      // `runtime/server/utils/image.js`. It declares no peer dependency for it, and this
      // project runs Nuxt 4.5 on nitropack v2, where that specifier does not exist.
      // Without this alias the server bundle imports a package that is not installed.
      //
      // A `patchedDependencies` entry cannot express this. `pnpm patch` extracts a
      // PRISTINE copy that imports from `#imports`, so the diff comes out empty; the bad
      // bytes live in pnpm's unpacked store layer and re-materialise on any install. An
      // alias is immune to that because it never depends on what is on disk.
      //
      // Remove when the app moves to nitro v3, or when @nuxt/image ships the v2
      // compatibility path its sibling @nuxt/scripts@2.0.0-beta.2 already carries.
      'nitro/runtime-config': 'nitropack/runtime',
    },
  },

  // Nuxt UI collects its app-config slots into the icon client bundle during module
  // setup. Declare the semantic mapping here as well as in app.config so its default
  // Lucide slots never become a second implicit allowlist.
  appConfig: {
    ui: { icons: UI_ICON_SLOTS },
  },

  modules: [
    '@nuxt/fonts',
    '@nuxt/image',
    '@nuxt/scripts',
    'motion-v/nuxt',
    'reka-ui/nuxt',
    '@nuxt/ui',
  ],

  css: [
    join(currentDir, './css/global.css'),
  ],

  components: {
    dirs: [
      {
        // Absolute, because two graphs extend this layer (the root app and
        // apps/brand-kit) and a relative path resolves against the extending
        // layer's srcDir.
        path: join(currentDir, './app/components'),
        pathPrefix: false,
        // Higher priority so design-system primitives win shadow conflicts against an
        // app-level component of the same basename.
        priority: 10,
      },
    ],
  },

  // Canonical type stack for every surface that extends this layer (the root app and
  // apps/brand-kit). Keep in sync through this single block; do not redeclare it in the
  // root or app configs. DM Sans carries body copy, Poppins the display scale — see
  // DESIGN.md. Both come from the provider rather than `public/fonts`, because this repo
  // ships no self-hosted faces for either family.
  fonts: {
    // Both families are global. CSS variable discovery cannot add another face, so avoid
    // parsing every component style during each Vite build.
    processCSSVariables: false,
    families: [
      { name: 'DM Sans', weights: [400, 500, 600, 700], global: true },
      { name: 'Poppins', weights: [600, 700], global: true },
    ],
  },

  icon: {
    aliases: iconAliases,
    clientBundle: {
      // Ship the active set's resolved role icons. The root config keeps
      // `scan: true` and the remote server bundle, so raw `i-*` ids written
      // outside this layer still resolve the way they always have.
      icons: iconBundleList(),
    },
  },

  ui: {
    experimental: { componentDetection: true },
    theme: {
      colors: ['primary', 'secondary', 'tertiary', 'info', 'success', 'warning', 'error'],
    },
  },

})
