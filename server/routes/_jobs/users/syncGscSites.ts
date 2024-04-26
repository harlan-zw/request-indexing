import { notInArray } from 'drizzle-orm/sql/expressions/conditions'
import { sites, userSites, users } from '~/server/database/schema'
import { fetchGscSitesWithSitemaps } from '~/server/app/services/gsc'
import { createSites } from '~/server/app/models/Site'
import { defineJobHandler } from '~/server/plugins/eventServiceProvider'

// should be able to be triggered at any time without duplicate data
export default defineJobHandler(async (event) => {
  const { userId } = await readBody<{ userId: number }>(event)

  const user = await useDrizzle().query.users.findFirst({
    where: eq(users.userId, userId),
  })
  if (!user) {
    throw createError({
      statusCode: 404,
      message: 'User not found',
    })
  }

  const db = useDrizzle()
  const gscSites = (await fetchGscSitesWithSitemaps(user.loginTokens))
  const siteProperties = gscSites.map(s => s.siteUrl).filter(Boolean) as string[]
  // we're syncing to a team
  // const currentSites = await db.select({ siteId: sites.siteId, property: sites.property })
  //   .from(sites)
  //   .where(notInArray(sites.property, siteProperties))
  // prefer a query
  const currentSites = await db.query.sites.findMany({
    with: {
      userSites: {
        where: eq(userSites.userId, userId),
      },
    },
    where: notInArray(sites.property, siteProperties),
  })

  // need to split sites into two groups:
  // 1. ones that have never been created before
  // 2. ones that exist but have not be linked to the team
  const newSites: typeof gscSites = []
  const unlinkedSites: typeof currentSites = []
  for (const site of gscSites) {
    const existingSite = currentSites
      .find(cs => cs.property === site.siteUrl)
    if (existingSite && !existingSite?.userSites?.[0])
      unlinkedSites.push(existingSite)
    else
      newSites.push(site)
  }

  if (newSites.length) {
    await createSites({
      sites: newSites.map(s => ({
        ownerId: user.userId,
        property: s.siteUrl,
        active: !s.siteUrl!.startsWith('sc-domain:'),
        domain: !s.siteUrl!.startsWith('sc-domain:') ? s.siteUrl : null,
        sitemaps: s.sitemaps,
      })),
      userSites: newSites.map(s => ({
        permissionLevel: s.permissionLevel,
      })),
    }, user)
  }

  if (unlinkedSites.length) {
    await db.batch(unlinkedSites.map(site => [
      db.insert(userSites).values({
        userId: user.userId,
        siteId: site.siteId,
        permissionLevel: gscSites.find(s => s.siteUrl === site.property)?.permissionLevel,
      }),
    ]).flat())
  }

  return {
    broadcastTo: [
      // created sites are not active by default
      `user:${user.publicId}`,
    ],
  }
})
