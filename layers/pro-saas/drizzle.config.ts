import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  schema: [
    './layers/pro-saas/server/database/schema.ts',
    './layers/pro-perf/server/database/schema.ts',
    './layers/pro-dataforseo/server/database/schema.ts',
    './layers/pro-reports/server/database/schema.ts',
    './layers/pro-indexing/server/database/schema.ts',
    './layers/nuxt-seo-pro/server/database/schema.ts',
  ],
  out: './layers/pro-saas/migrations',
})
