import type { SiteInsert, SiteSelect, UserSelect, UserSitesInsert } from '~~/layers/core/server/db/schema'
import { sites, userSites } from '~~/layers/core/server/db/schema'

export async function createSites(data: { sites: SiteInsert[], userSites: Partial<UserSitesInsert>[] }, user: UserSelect, env?: Record<string, unknown>): Promise<SiteSelect[]> {
  const db = useDrizzle()
  const siteQueries = data.sites.map(site => db.insert(sites).values(site).returning())
  const [firstSiteQuery, ...remainingSiteQueries] = siteQueries
  const childSites: SiteSelect[] = firstSiteQuery
    ? (await db.batch([firstSiteQuery, ...remainingSiteQueries])).flat()
    : []

  const newUserSites: UserSitesInsert[] = childSites.map((site, index) => {
    return {
      userId: user.userId,
      siteId: site.siteId,
      permissionLevel: data.userSites[index]?.permissionLevel,
    }
  })
  const userSiteQueries = newUserSites.map(data => db.insert(userSites).values(data).returning())
  const [firstUserSiteQuery, ...remainingUserSiteQueries] = userSiteQueries
  if (firstUserSiteQuery)
    await db.batch([firstUserSiteQuery, ...remainingUserSiteQueries])

  await Promise.all(childSites.map((site, i) => ({
    ...site,
    env: env ?? {},
    permissionLevel: data.userSites[i]?.permissionLevel ?? undefined,
    userId: user.userId,
  })).map((site) => {
    return emitAppEvent('app:site:created', site)
  }))
  return childSites
}
