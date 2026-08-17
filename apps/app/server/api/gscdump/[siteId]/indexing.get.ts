export default defineGscdumpSiteHandler(({ event, gscdumpSiteId }) => {
  const query = getQuery(event)
  const gscdump = useGscdumpClient()

  return gscdump.getIndexing(gscdumpSiteId, Number(query.days) || 28)
})
