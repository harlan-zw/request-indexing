import type { GscdumpAnalysisParams } from '~~/layers/pro-gsc/shared/gscdump-api'

export default defineGscdumpSiteHandler(({ event, gscdumpSiteId }) => {
  const query = getQuery(event) as Record<string, string>
  const gscdump = useGscdumpClient()

  return gscdump.getAnalysis(gscdumpSiteId, query as unknown as GscdumpAnalysisParams)
})
