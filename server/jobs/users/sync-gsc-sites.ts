import { withoutTrailingSlash } from 'ufo'
import { sites, users, userSites } from '~/server/db/schema'
import { broadcastToUser } from '~/server/utils/event-service'
import { defineJob } from '../_types'

export default defineJob({
  name: 'users/sync-gsc-sites',
  queue: 'default',
  async handle(payload, ctx) {
    const { userId } = payload
    const db = ctx.db

    const user = await db.query.users.findFirst({
      where: eq(users.userId, userId),
      with: {
        googleAccounts: {
          with: {
            googleOAuthClient: true,
          },
        },
      },
    })
    const googleAccount = user?.googleAccounts?.[0]
    if (!user || !googleAccount)
      throw new Error('User not found')

    if (!user.gscdumpUserId)
      throw new Error('User not registered with gscdump')

    const gscdump = useGscdumpClient()
    const { sites: gscSites } = await gscdump.getAvailableSites(user.gscdumpUserId)

    const siteIdsSq = db.select({
      siteId: userSites.siteId,
    })
      .from(userSites)
      .where(eq(userSites.userId, userId))
      .as('siteIdsSq')

    const currentSites = await db.select({
      siteId: sites.siteId,
      property: sites.property,
      domain: sites.domain,
    })
      .from(sites)
      .rightJoin(siteIdsSq, eq(sites.siteId, siteIdsSq.siteId))

    const sitesToCreate: typeof gscSites = []
    const sitesToSync: typeof gscSites = []
    for (const site of gscSites) {
      if (currentSites.some(cs => cs.property === site.siteUrl))
        sitesToSync.push(site)
      else
        sitesToCreate.push(site)
    }

    if (sitesToCreate.length) {
      await createSites({
        sites: sitesToCreate.map(s => ({
          ownerId: user.userId,
          property: s.siteUrl,
          active: !s.siteUrl.startsWith('sc-domain:'),
          domain: !s.siteUrl.startsWith('sc-domain:') ? withoutTrailingSlash(s.siteUrl) : null,
          gscdumpSiteId: s.siteId || null,
          gscdumpSiteUrl: s.siteUrl,
          gscdumpSyncStatus: s.syncStatus || null,
        })),
        userSites: sitesToCreate.map(s => ({
          permissionLevel: s.permissionLevel,
        })),
      }, user)
    }

    if (sitesToSync.length) {
      const stmts = sitesToSync.map((gscSite) => {
        const site = currentSites.find(cs => cs.property === gscSite.siteUrl)!
        return [
          db.insert(userSites).values({
            userId: user.userId,
            siteId: site.siteId!,
            permissionLevel: gscSite.permissionLevel,
          }).onConflictDoUpdate({
            target: [userSites.userId, userSites.siteId],
            set: {
              permissionLevel: gscSite.permissionLevel,
            },
          }),
          ...(gscSite.siteId
            ? [db.update(sites).set({
                gscdumpSiteId: gscSite.siteId,
                gscdumpSiteUrl: gscSite.siteUrl,
                gscdumpSyncStatus: gscSite.syncStatus || null,
              }).where(eq(sites.siteId, site.siteId!))]
            : []),
        ]
      }).flat()
      await db.batch(stmts)
    }

    // Broadcast sync results
    broadcastToUser(user.publicId, {
      name: 'users/sync-gsc-sites',
      entityId: userId,
      entityType: 'user',
      payload: {
        totalSites: sitesToCreate.length + sitesToSync.length,
        createdSites: sitesToCreate.length,
        syncedSites: sitesToSync.length,
      },
    })
  },
})
