import type { BuilderStateWire } from '@gscdump/contracts'

export default defineGscdumpSiteHandler(({ event, gscdumpSiteId }) => {
  const query = getQuery(event)
  const gscdump = useGscdumpClient()

  const state = JSON.parse(decodeURIComponent(String(query.q))) as BuilderStateWire
  const comparison = query.qc ? JSON.parse(decodeURIComponent(String(query.qc))) as BuilderStateWire : undefined

  return gscdump.getDataDetail(gscdumpSiteId, state, { comparison })
})
