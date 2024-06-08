import { consola } from 'consola'
import { isNull, not } from 'drizzle-orm'
import { queueJob } from '~/server/plugins/eventServiceProvider'
import { sites } from '~/server/database/schema'

export default defineTask({
  meta: {
    name: 'site:crawl',
    description: 'Crawl Site pages',
  },
  async run({ payload }) {
    // if (!import.meta.dev)
    //   return
    //
    // if (!payload.siteId) {
    //   // run for all sites with a domain
    //   const db = useDrizzle()
    //   const _sites = await db.query.sites.findMany({
    //     where: not(isNull(sites.domain)),
    //   })
    //   _sites.forEach((site) => {
    //     queueJob('sites/syncSitemapPages', { siteId: site.siteId })
    //   })
    //   return { result: `Success - ${_sites.length}` }
    // }
    //
    // consola.info('Running Crawl...')
    // // run job
    // await queueJob('sites/syncSitemapPages', { siteId: payload.siteId })
    // // await queueJob('sites/syncSitemapPages', { siteId: payload.siteId })
    // return { result: 'Success' }
  },
})
