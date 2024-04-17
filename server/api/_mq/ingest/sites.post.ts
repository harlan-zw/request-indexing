import {
  fetchGscSitesWithSitemaps,
} from '~/server/app/services/gsc'
import { sites, teamSites, userTeamSites, users } from '~/server/database/schema'
// import { wsUsers } from '~/server/routes/_ws'

export default defineEventHandler(async (event) => {
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
  // we're syncing to a team
  const currentSites = await db.select({ siteId: sites.siteId, property: sites.property })
    .from(teamSites)
    .leftJoin(sites, eq(teamSites.siteId, sites.siteId))
    .where(eq(teamSites.teamId, user.currentTeamId))
  const nonSyncedSites = gscSites.filter(s => !currentSites.some(cs => cs.property === s.siteUrl))
  if (!nonSyncedSites.length)
    return 'OK'

  const batchResults = (await db.batch(nonSyncedSites
    .map(site => db.insert(sites).values({
      property: site.siteUrl,
      isDomainProperty: site.siteUrl!.startsWith('sc-domain:'),
      domain: !site.siteUrl!.startsWith('sc-domain:') ? site.siteUrl : null,
      sitemaps: site.sitemaps,
    }).returning({ siteId: sites.siteId, property: sites.property }))))

  await db.batch(batchResults.map(site => [
    db.insert(userTeamSites).values({
      userId: user.userId,
      teamId: user.currentTeamId,
      siteId: site[0].siteId,
      // we can't sync the permission level to the site table
      permissionLevel: gscSites.find(s => s.siteUrl === site[0].property)?.permissionLevel,
    }),
    db.insert(teamSites).values({
      teamId: user.currentTeamId,
      siteId: site[0].siteId,
    }),
  ]).flat())

  // console.log('sending ws', wsUsers, wsUsers.has(user.publicId))
  // if (wsUsers.has(user.publicId))
  //   wsUsers.get(user.publicId)!.send({ event: 'site-synced', payload: JSON.stringify(batchResults) })
  const nitro = useNitroApp()
  await nitro.hooks.callHook(`ws:message:${userId}`, { event: 'site-synced' })

  for (const site of batchResults) {
    const mq = useMessageQueue()
    await mq.message('/api/_mq/ingest/site/meta', { siteId: site[0].siteId, userId })
  }

  // const startDate = dayjs().subtract(17, 'month').toDate()
  // const endDate = dayjs().subtract(16, 'month').toDate()
  // const siteData = await Promise.all(_sites.map(async (s) => {
  //   const { startDate: startOfData } = await fetchGSCDates(user.loginTokens, {
  //     period: {
  //       start: startDate,
  //       end: endDate,
  //     },
  //   }, s)
  //   // if the date is 16 months ago then they're losing data
  //   return {
  //     isLosingData: !!startOfData,
  //     startOfData, // we'll need to do a full scan of the dates
  //     domain: s.siteUrl.replace('sc-domain:', '').replace('https://', ''),
  //     ...s,
  //   }
  // }))
  // // dedupe based on domain
  // const dedupedSites = siteData.reduce((acc, site) => {
  //   if (acc.find(s => s.domain === site.domain))
  //     return acc
  //   return [...acc, site]
  // }, [] as typeof siteData)
  // const appendSites: typeof siteData = []
  // for (const site of dedupedSites) {
  //   // if (site.siteUrl.startsWith('sc-domain')) {
  //   // we need to fetch pages for last 30 days to figure out subdomains
  //   // TODO parralel
  //   const start = dayjs().subtract(28, 'day').toDate()
  //   const end = dayjs().subtract(1, 'day').toDate()
  //   const pages = await fetchGSCPages(user.loginTokens, { period: { start, end } }, site)
  //   ;[...new Set(pages.rows.map((p) => {
  //     return parseURL(p.keys![0]).host
  //   }))].filter(Boolean).forEach((s) => {
  //     const index = siteData.findIndex(d => d.domain === s)
  //     if (index === -1) {
  //       appendSites.push({
  //         ...site,
  //         // filter sitemaps for subdomain
  //         sitemaps: site.sitemaps?.filter(sitemap => sitemap.path.replace('https://', '').startsWith(s)),
  //         domain: s!,
  //         pageCount30Day: pages.rows.filter(p => parseURL(p.keys![0]).host === s).length,
  //       })
  //     }
  //     else {
  //       siteData[index].pageCount30Day = pages.rows.filter(p => parseURL(p.keys![0]).host === s).length
  //     }
  //   })
  //   // }
  // }
  // await useDrizzle().insert(sites).values([
  //   ...appendSites,
  //   ...siteData,
  // ]
  //   .sort((a, b) => a.siteUrl.localeCompare(b.siteUrl))
  //   .map((site) => {
  //     console.log({
  //       userId,
  //       siteUrl: site.siteUrl,
  //       domain: site.domain,
  //       isLosingData: site.isLosingData ? 1 : 0,
  //       permissionLevel: site.permissionLevel,
  //       startOfData: site.startOfData ? new Date(site.startOfData).getTime() : undefined,
  //       sitemaps: [], // site.sitemaps,
  //       pageCount30Day: site.pageCount30Day || 0,
  //     })
  //     return {
  //       userId,
  //       siteUrl: site.siteUrl,
  //       domain: site.domain,
  //       isLosingData: site.isLosingData ? 1 : 0,
  //       permissionLevel: site.permissionLevel,
  //       startOfData: site.startOfData ? new Date(site.startOfData).getTime() : undefined,
  //       sitemaps: [], // site.sitemaps,
  //       pageCount30Day: site.pageCount30Day || 0,
  //     }
  //   },
  //   ),
  // ).returning()
  // await storage.setItem(`sites.json`, finalSites)
  return 'OK'
})
