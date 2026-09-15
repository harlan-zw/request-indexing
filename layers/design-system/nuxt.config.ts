import { join } from 'node:path'

const currentDir = import.meta.dirname

// Design system layer: shared UI primitives, chart types, and presentation utilities used across
// every layer. No domain logic — domain types live in pro-saas/shared per ADR-0005.
//
// Layout follows nuxtseo.com: `app/{components,composables,utils}` for the client surface,
// `css/global.css` for the tokens, `types/` at the layer root.

export default {
  components: [
    {
      // Absolute, because two graphs extend this layer (the root app and
      // apps/brand-kit) and a relative path resolves against the extending
      // layer's srcDir.
      path: join(currentDir, './app/components'),
      pathPrefix: false,
    },
  ],
}
