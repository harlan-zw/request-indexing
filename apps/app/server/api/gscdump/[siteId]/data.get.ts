import type { BuilderStateWire, GscComparisonFilter } from '@gscdump/contracts'

export default defineGscdumpSiteHandler(({ event, gscdumpSiteId }) => {
  const query = getQuery(event)
  const gscdump = useGscdumpClient()

  const state = JSON.parse(decodeURIComponent(String(query.q))) as BuilderStateWire
  const comparison = query.qc ? JSON.parse(decodeURIComponent(String(query.qc))) as BuilderStateWire : undefined
  const filterValues: GscComparisonFilter[] = ['new', 'lost', 'improving', 'declining']
  const filter = filterValues.find(value => value === query.filter)

  return gscdump.getData(gscdumpSiteId, state, { comparison, filter })
})
