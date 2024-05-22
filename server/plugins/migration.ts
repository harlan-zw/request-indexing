import { consola } from 'consola'
import { migrate } from 'drizzle-orm/d1/migrator'
import { count } from 'drizzle-orm'
import { googleOAuthClients } from '~/server/database/schema'

export default defineNitroPlugin(async () => {
  if (!import.meta.dev)
    return

  onHubReady(async () => {
    await migrate(useDrizzle(), { migrationsFolder: 'server/database/migrations' })
      .then(() => {
        consola.success('Database migrations done')
      })
      .catch((err) => {
        consola.error('Database migrations failed', err)
      })
    // check if googleOAuthClients count is 0, if so we run the seed task
    const res = await useDrizzle().select({ count: count() }).from(googleOAuthClients)
    if (res[0].count === 0)
      await runTask('db:seed')
  })
})
