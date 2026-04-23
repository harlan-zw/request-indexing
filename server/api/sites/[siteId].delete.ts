import {
  siteDateAnalytics,
  siteKeywordDateAnalytics,
  sitePathDateAnalytics,
  sitePaths,
  sites,
  teamSites,
  userSites,
} from '~/server/db/schema'

export default defineEventHandler(async (e) => {
  await requireAdminAuth(e)
  const { siteId } = getRouterParams(e, { decode: true })
  const db = useDrizzle()

  // Delete from gscdump if registered
  const site = await db.query.sites.findFirst({
    where: eq(sites.siteId, Number(siteId)),
  })
  if (site?.gscdumpSiteId) {
    const gscdump = useGscdumpClient()
    await gscdump.deleteSite(site.gscdumpSiteId).catch((err) => {
      console.error('Failed to delete site from gscdump:', err)
    })
  }

  // Clean up local relations
  await db.delete(sitePaths).where(eq(sitePaths.siteId, Number(siteId)))
  await db.delete(siteDateAnalytics).where(eq(siteDateAnalytics.siteId, Number(siteId)))
  await db.delete(sitePathDateAnalytics).where(eq(sitePathDateAnalytics.siteId, Number(siteId)))
  await db.delete(siteKeywordDateAnalytics).where(eq(siteKeywordDateAnalytics.siteId, Number(siteId)))
  await db.delete(userSites).where(eq(userSites.siteId, Number(siteId)))
  await db.delete(teamSites).where(eq(teamSites.siteId, Number(siteId)))
  await db.delete(sites).where(eq(sites.siteId, Number(siteId)))

  return 'OK'
})
