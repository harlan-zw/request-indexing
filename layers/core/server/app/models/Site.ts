import type { SiteInsert, SiteSelect, UserSelect, UserSitesInsert } from '~~/layers/core/server/db/schema'
import { sites, userSites } from '~~/layers/core/server/db/schema'

export async function createSites(data: { sites: SiteInsert[], userSites: Partial<UserSitesInsert>[] }, user: UserSelect, env?: Record<string, unknown>): Promise<SiteSelect[]> {
  const db = useDrizzle()
  const childSites: SiteSelect[] = (await db.batch(
    data.sites.map(site => db.insert(sites).values(site).returning()) as unknown as readonly [any, ...any[]],
  )).map(row => row[0])

  const newUserSites: UserSitesInsert[] = childSites.map((site, index) => {
    return {
      userId: user.userId,
      siteId: site.siteId,
      permissionLevel: data.userSites[index]?.permissionLevel,
    }
  })
  await db.batch(newUserSites.map(data => db.insert(userSites).values(data).returning()) as unknown as readonly [any, ...any[]])

  const nitro = useNitroApp()
  await Promise.all(childSites.map((site, i) => ({
    ...site,
    env: env ?? {},
    permissionLevel: data.userSites[i]?.permissionLevel,
    userId: user.userId,
  })).map((site) => {
    return nitro.hooks.callHookParallel('app:site:created' as any, site)
  }))
  return childSites
}
