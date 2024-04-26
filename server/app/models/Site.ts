import type { SiteInsert, UserSelect, UserSitesInsert } from '~/server/database/schema'
import { sites, userSites } from '~/server/database/schema'

export async function createSites(data: { sites: SiteInsert[], userSites: Partial<UserSitesInsert>[] }, user: UserSelect) {
  const db = useDrizzle()
  const childSites = (await db.batch(
    data.sites.map(site => db.insert(sites).values(site).returning()),
  )).map(row => row[0])

  const newUserSites: UserSitesInsert[] = childSites.map((site, index) => {
    return {
      userId: user.userId,
      siteId: site.siteId,
      permissionLevel: data.userSites[index]?.permissionLevel,
    }
  })
  await db.batch(newUserSites.map(data => db.insert(userSites).values(data)))
  //
  const nitro = useNitroApp()
  for (const site of childSites)
    // this triggers more jobs
    await nitro.hooks.callHook('app:site:created', { ...site, userId: user.userId })
}
