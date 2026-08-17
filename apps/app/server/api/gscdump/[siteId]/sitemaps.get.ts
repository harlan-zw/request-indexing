export default defineGscdumpSiteHandler(({ gscdumpSiteId }) => {
  const gscdump = useGscdumpClient()
  return gscdump.getSitemaps(gscdumpSiteId)
})
