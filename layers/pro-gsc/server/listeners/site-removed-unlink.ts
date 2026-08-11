import type { EventPayload } from '#domain-events/server'
import { defineListener } from '@harlan-zw/nuxt-domain-events/server'
import { useGscdumpClient } from '../utils/gscdump-client'

export default defineListener({
  name: 'gsc.site-removed-unlink',
  event: 'pro:site:removed',
  execution: { _tag: 'sync', failure: 'isolate' },
  handle: async ({ gscdumpSiteId }: EventPayload<'pro:site:removed'>) => {
    if (!gscdumpSiteId)
      return
    const client = useGscdumpClient()
    await client.deleteSite(gscdumpSiteId)
  },
})
