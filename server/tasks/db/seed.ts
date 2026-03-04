import { consola } from 'consola'
import { googleOAuthClients } from '~/server/db/schema'
import { tokens } from '#app/token-pool.mjs'
import type { OAuthPoolToken } from '~/types'

export default defineTask({
  meta: {
    name: 'db:seed',
    description: 'Run database seeder',
  },
  async run() {
    consola.info('Running DB seed task...')
    // await new Promise<void>((resolve) => {
    //   onHubReady(async () => {
    const mapped = (tokens as OAuthPoolToken[]).map((t, i) => ({
      clientId: t.client_id,
      clientSecret: t.client_secret,
      label: t.label || `OAuth Client ${i + 1}`,
    }))
    await useDrizzle().insert(googleOAuthClients).values(mapped)

    consola.success('Database seeding done')
    return { result: 'Success' }
  },
})
