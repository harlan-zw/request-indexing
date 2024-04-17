import dayjs from 'dayjs'
import { siteUrlAnalytics, siteUrls, sites, teamSites, userTeamSites, users } from '~/server/database/schema'
// import { wsUsers } from '~/server/routes/_ws'

export default defineEventHandler(async (event) => {
  const { siteId, userId } = await readBody<{ siteId: number, userId: number }>(event)

  const db = useDrizzle()
  const [site, user] = await Promise.all([
    db.query.sites.findFirst({
      where: eq(sites.siteId, siteId),
      with: {
        userTeamSites: {
          where: eq(userTeamSites.userId, userId),
        },
      },
    }),
    db.query.users.findFirst({
      where: eq(users.userId, userId),
    }),
  ])

  if (!site || !user) {
    throw createError({
      statusCode: 404,
      message: 'Site or User not found',
    })
  }

  const startDate = dayjs().subtract(17, 'month').toDate()
  const endDate = dayjs().subtract(16, 'month').toDate()
  const { rows } = await fetchGSCDates(user.loginTokens, {
    period: {
      start: startDate,
      end: endDate,
    },
  }, site)
  // insert the rows
  if (rows.length) {
    await db.batch(rows.map((row) => {
      return db.insert(siteUrlAnalytics).values({
        ...row,
        siteId,
      })
    }))
  }
  // we need to fetch pages for last 30 days to figure out subdomains
  // TODO parralel
  const start = dayjs().subtract(28, 'day').toDate()
  const end = dayjs().subtract(1, 'day').toDate()
  const pages = await fetchGSCPages(user.loginTokens, { period: { start, end } }, site)
  if (!pages.rows.length) {
    // no pages, all okay
    return 'OK'
  }

  if (site.isDomainProperty) {
    const distinctDomains = new Set<string>()
    pages.rows.forEach((row) => {
      distinctDomains.add(new URL(row.page).origin)
    })
    // get current sites under the domain
    const currentSites = await db.query.sites.findMany({
      where: eq(sites.parentId, site.siteId),
    })
    const missingSites = [...distinctDomains].filter((domain) => {
      return !currentSites.find(s => s.domain === domain)
    })
    // batch insert new sites
    const childSites = await db.batch(missingSites.map((_site) => {
      return db.insert(sites).values({
        sitemaps: site.sitemaps.filter(s => s.path.startsWith(_site)),
        property: site.property,
        isDomainProperty: false,
        domain: _site,
        parentId: site.siteId,
      }).returning()
    }))

    const mq = useMessageQueue()
    for (const _site of childSites) {
      await db.insert(userTeamSites).values({
        userId: user.userId,
        teamId: user.currentTeamId,
        siteId: _site[0].siteId,
        permissionLevel: site.userTeamSites[0].permissionLevel,
      })
      await db.insert(teamSites).values({
        teamId: user.currentTeamId,
        siteId: _site[0].siteId,
      })
      // more accurate data if filtered
      await mq.message('/api/_mq/ingest/site/meta', { siteId: _site[0].siteId, userId })
    }
  }
  else {
    await db.batch(pages.rows.map((row) => {
      return db.insert(siteUrls).values({
        path: new URL(row.page).pathname,
        siteId,
      })
    }))
  }

  const nitro = useNitroApp()
  await nitro.hooks.callHook(`ws:message:${userId}`, { event: 'site-synced', payload: { siteId } })
  return 'OK'
})
