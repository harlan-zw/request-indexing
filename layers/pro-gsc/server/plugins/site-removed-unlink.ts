// On site removal, gscdump-side cleanup. The producer fires BEFORE the row
// purge so `gscdumpSiteId` is still readable on the payload.

import { useGscdumpClient } from '../utils/gscdump-client'

export default defineProListener('pro:site:removed', async ({ gscdumpSiteId }) => {
  if (!gscdumpSiteId)
    return
  const client = useGscdumpClient()
  await client.deleteSite(gscdumpSiteId)
})
