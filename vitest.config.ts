import { fileURLToPath } from 'node:url'
import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    // Nuxt resolves `#shared` in the app build. A node-environment unit test
    // gets no Nuxt resolver, so map it here rather than reaching into
    // `shared/` with a relative path, which the Nitro build cannot bundle.
    alias: {
      '#shared': fileURLToPath(new URL('./shared', import.meta.url)),
      '~~': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
})
