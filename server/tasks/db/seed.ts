import { consola } from 'consola'
import { googleOAuthClients } from '~/server/database/schema'
import { tokens } from '#app/token-pool.mjs'

export default defineTask({
  meta: {
    name: 'db:seed',
    description: 'Run database seeder',
  },
  async run() {
    consola.info('Running DB seed task...')
    // await new Promise<void>((resolve) => {
    //   onHubReady(async () => {
    await useDrizzle().insert(googleOAuthClients).values(tokens)

    consola.success('Database seeding done')
    return { result: 'Success' }
  },
})
