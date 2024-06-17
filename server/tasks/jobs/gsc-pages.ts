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
    // await queueJob('crux/history', {
    //   payload: { siteId: payload.siteId, strategy: 'DESKTOP' },
    //   entityId: payload.siteId,
    //   entityType: 'site',
    // })
    await queueJob('sites/syncWebIndexing', {
      payload: { siteId: payload.siteId },
      entityId: payload.siteId,
      entityType: 'site',
    })
    // await queueJob('sites/syncSitemapPages', { siteId: payload.siteId })
    consola.success('Sync GSC pages done')
    return { result: 'Success' }
  },
})
