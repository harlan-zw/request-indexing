import { withoutTrailingSlash } from 'ufo'
import { sites, userSites, users } from '~/server/database/schema'
import { fetchGscSites } from '~/server/app/services/gsc'
import { defineJobHandler } from '~/server/plugins/eventServiceProvider'

// should be able to be triggered at any time without duplicate data
export default defineJobHandler(async (event) => {
  const { userId } = await readBody<{ userId: number }>(event)

  const user = await useDrizzle().query.users.findFirst({
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
  if (!user || !googleAccount) {
    throw createError({
      statusCode: 404,
      message: 'User not found',
    })
  }

  const db = useDrizzle()
  const gscSites = (await fetchGscSites(googleAccount))
  // must have valid permission, we should show it regardless?
  // .filter((s) => {
  //   return s.permissionLevel !== 'siteUnverifiedUser'
  // })
  // we're syncing to a team
  // const currentSites = await db.select({ siteId: sites.siteId, property: sites.property })
  //   .from(sites)
  //   .where(notInArray(sites.property, siteProperties))
  // prefer a query
  // const currentSites = await db.query.sites.findMany({
  //   columns: {
  //     property: true,
  //   },
  //   with: {
  //     userSites: {
  //       where: eq(userSites.userId, userId),
  //     },
  //   },
  //   where: notInArray(sites.property, gscSites.map(s => s.siteUrl!)),
  // })

  const siteIdsSq = db.select({
    siteId: userSites.siteId,
  })
    .from(userSites)
    .where(eq(userSites.userId, userId))
    .as('siteIdsSq')

  // select from sites, must have a user site relation
  const currentSites = await db.select({
    siteId: sites.siteId,
    property: sites.property,
    domain: sites.domain,
  })
    .from(sites)
    .rightJoin(siteIdsSq, eq(sites.siteId, siteIdsSq.siteId))

  // need to split sites into two groups:
  // 1. ones that have never been created before
  // 2. ones that exist but have not be linked to the team
  const sitesToCreate: typeof gscSites = []
  const sitesToSync: typeof gscSites = []
  for (const site of gscSites) {
    if (currentSites.some(cs => cs.property === site.siteUrl))
      sitesToSync.push(site)
    else
      sitesToCreate.push(site)
  }

  // let createdSites: typeof currentSites = []
  if (sitesToCreate.length) {
    await createSites({
      sites: sitesToCreate.map(s => ({
        ownerId: user.userId,
        property: s.siteUrl,
        active: !s.siteUrl!.startsWith('sc-domain:'),
        domain: !s.siteUrl!.startsWith('sc-domain:') ? withoutTrailingSlash(s.siteUrl!) : null,
        // sitemaps: s.sitemaps,
      })),
      userSites: sitesToCreate.map(s => ({
        permissionLevel: s.permissionLevel,
      })),
    }, user)
  }

  if (sitesToSync.length) {
    const sql = sitesToSync.map((gscSite) => {
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
      ]
    }).flat()
    await db.batch(sql)
  }

  return {
    totalSites: sitesToCreate.length + sitesToSync.length,
    createdSites: sitesToCreate.length,
    syncedSites: sitesToSync.length,
    broadcastTo: user.publicId,
  }
})
