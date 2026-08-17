export default defineGscdumpSiteHandler(({ gscdumpSiteId }) => {
  const gscdump = useGscdumpClient()
  return gscdump.getIndexingDiagnostics(gscdumpSiteId)
})
