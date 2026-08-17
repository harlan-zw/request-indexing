import type { GscdumpIndexingUrlStatus } from '@gscdump/contracts'

export default defineGscdumpSiteHandler(({ event, gscdumpSiteId }) => {
  const query = getQuery(event)
  const gscdump = useGscdumpClient()
  const statusValues: GscdumpIndexingUrlStatus[] = ['indexed', 'not_indexed', 'pending']
  const status = statusValues.find(value => value === query.status)

  return gscdump.getIndexingUrls(gscdumpSiteId, {
    limit: Number(query.limit) || undefined,
    offset: Number(query.offset) || undefined,
    status,
    issue: query.issue as string,
    search: query.search as string,
  })
})
