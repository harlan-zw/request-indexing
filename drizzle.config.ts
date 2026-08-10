import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite', // "postgresql" | "mysql"
  driver: 'd1-http',
  schema: './layers/core/server/db/schema.ts',
  out: './layers/core/server/db/migrations',
})
