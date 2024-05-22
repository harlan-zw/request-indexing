import { authenticateAdmin } from '~/server/app/utils/auth'
import {
  siteDateAnalytics,
  siteKeywordDateAnalytics,
  sitePathDateAnalytics,
  sitePaths,
  sites,
  teamSites,
  userSites,
} from '~/server/database/schema'

export default defineEventHandler(async (e) => {
  await authenticateAdmin(e)
  const { siteId } = getRouterParams(e, { decode: true })
  const db = useDrizzle()
  // need to clean up the site, delete any relations first
  await db.delete(sitePaths).where(eq(sitePaths.siteId, Number(siteId)))
  await db.delete(siteDateAnalytics).where(eq(siteDateAnalytics.siteId, Number(siteId)))
  await db.delete(sitePathDateAnalytics).where(eq(sitePathDateAnalytics.siteId, Number(siteId)))
  await db.delete(siteKeywordDateAnalytics).where(eq(siteKeywordDateAnalytics.siteId, Number(siteId)))
  await db.delete(userSites).where(eq(userSites.siteId, Number(siteId)))
  await db.delete(teamSites).where(eq(teamSites.siteId, Number(siteId)))
  // finally clear the site
  await db.delete(sites).where(eq(sites.siteId, Number(siteId)))

  return 'OK'
})
