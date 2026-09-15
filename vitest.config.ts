import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig, defineProject } from 'vitest/config'

const ROOT = fileURLToPath(new URL('.', import.meta.url))

// nuxtseo.com discovers its committed workflows by suffix rather than by
// directory, so a test sits next to what it covers. Same three suffixes here:
//
//   *.client.feature.test.ts  a component or composable rendered in a DOM
//   *.feature.test.ts         a seam crossed without a browser
//   *.test.ts                 everything else: pure functions, parsers
const CLIENT_FEATURE = '**/*.client.feature.test.ts'
const FEATURE = '**/*.feature.test.ts'
const UNIT = '**/*.test.ts'

const EXCLUDE = ['**/node_modules/**', '**/.nuxt/**', '**/.output/**', '**/dist/**']

// `#shared` and `#schema/pro` are Nuxt build aliases. A node-environment test
// gets no Nuxt resolver, so they are mapped here; `#schema/pro` points at the
// barrel `modules/drizzle-layers` emits, which means a test importing it needs
// `nuxt prepare` to have run at least once. That is what `postinstall` does.
function alias() {
  return [
    { find: '#schema/pro', replacement: fileURLToPath(new URL('./.nuxt/drizzle-layers/pro/schema.ts', import.meta.url)) },
    { find: '#db/pro', replacement: fileURLToPath(new URL('./.nuxt/drizzle-layers/pro/db.ts', import.meta.url)) },
    { find: '#shared', replacement: fileURLToPath(new URL('./shared', import.meta.url)) },
    { find: /^#layers\/(.*)$/, replacement: `${ROOT}layers/$1` },
    { find: '~~', replacement: ROOT },
  ]
}

/**
 * Nuxt stamps `import.meta.client` and `import.meta.server` at build time.
 * Vitest leaves both undefined, so a composable guarded on `import.meta.client`
 * does nothing at all and the test asserts against a no-op. The client project
 * runs the browser branch, so the flags are rewritten for it here.
 */
function nuxtBuildFlags() {
  return {
    name: 'nuxt-build-flags',
    enforce: 'pre' as const,
    transform(code: string, id: string) {
      if (id.includes('/node_modules/') || !/import\.meta\.(?:client|server)/.test(code))
        return null
      return {
        code: code
          .replace(/import\.meta\.client/g, 'true')
          .replace(/import\.meta\.server/g, 'false'),
        map: null,
      }
    },
  }
}

export default defineConfig({
  test: {
    projects: [
      defineProject({
        test: {
          name: 'unit',
          environment: 'node',
          include: [UNIT],
          exclude: [...EXCLUDE, FEATURE, CLIENT_FEATURE],
          globals: true,
        },
        resolve: { alias: alias() },
      }),
      defineProject({
        plugins: [vue()],
        test: {
          name: 'feature',
          environment: 'node',
          include: [FEATURE],
          exclude: [...EXCLUDE, CLIENT_FEATURE],
          globals: true,
        },
        resolve: { alias: alias() },
      }),
      defineProject({
        plugins: [vue(), nuxtBuildFlags()],
        test: {
          name: 'client',
          environment: 'happy-dom',
          include: [CLIENT_FEATURE],
          exclude: EXCLUDE,
          setupFiles: ['tests/setup/client.ts'],
          globals: true,
        },
        resolve: { alias: alias() },
      }),
    ],
  },
})
