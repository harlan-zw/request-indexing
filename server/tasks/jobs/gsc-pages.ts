import { consola } from 'consola'
import { queueJob } from '~/server/plugins/eventServiceProvider'

export default defineTask({
  meta: {
    name: 'gsc:pages',
    description: 'Sync GSC pages',
  },
  async run({ payload, context }) {
    if (!import.meta.dev)
      return

    consola.info('Running Sync GSC Pages...')
    // run job
    await queueJob('sites/syncGscDate', { siteId: payload.siteId, date: payload.date })
    // await queueJob('sites/syncSitemapPages', { siteId: payload.siteId })
    consola.success('Sync GSC pages done')
    return { result: 'Success' }
  },
})
