import { consola } from 'consola'
import { queueJob } from '~/server/plugins/eventServiceProvider'

export default defineTask({
  meta: {
    name: 'psi:page',
    description: 'Sync GSC pages',
  },
  async run({ payload }) {
    if (!import.meta.dev)
      return

    consola.info('Running PSI...')
    await queueJob('paths/runPsi', payload)
    consola.success('Running PSI done')
    return { result: 'Success' }
  },
})
