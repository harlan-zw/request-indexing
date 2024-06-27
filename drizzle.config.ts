import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite', // "postgresql" | "mysql"
  driver: 'd1-http',
  schema: './server/database/schema.ts',
  out: './server/database/migrations',
})
