import { consola } from 'consola'
import { queueJob } from '~/server/plugins/eventServiceProvider'

export default defineTask({
  meta: {
    name: 'gsc:pages',
    description: 'Sync GSC pages',
  },
  async run({ payload }) {
    if (!import.meta.dev)
      return

    consola.info('Running Sync GSC Pages...')
    // run job
    await queueJob('sites/syncFinished', { siteId: payload.siteId })
    // await queueJob('sites/syncSitemapPages', { siteId: payload.siteId })
    consola.success('Sync GSC pages done')
    return { result: 'Success' }
  },
})
