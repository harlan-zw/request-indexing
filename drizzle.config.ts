import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite', // "postgresql" | "mysql"
  driver: 'd1-http',
  schema: './server/db/schema.ts',
  out: './server/db/migrations',
})
