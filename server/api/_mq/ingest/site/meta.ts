import dayjs from 'dayjs'
import {
  siteUrlAnalytics,
  siteUrls,
  sites,
  teamSites,
  userTeamSites,
  users,
  SiteUrlSelect
} from '~/server/database/schema'
import { fetchSitemapUrls } from '~/server/app/services/crawler/crawl'
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
    // no pages, all okay?
    return 'OK'
  }
  const mq = useMessageQueue()
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
    let sitemapUrls: SiteUrlSelect[] = []
    if (site.sitemaps) {
      sitemapUrls = (await fetchSitemapUrls({
        siteUrl: site.domain,
        sitemapPaths: site.sitemaps.map(s => s.path),
      })).map(r => r.sites).flat().map((r) => {
        return <SiteUrlSelect> {
          isIndexed: false,
          path: new URL(r).pathname,
          siteId,
        }
      })
    }
    else {
      // TODO manual sitemap crawl
    }

    const indexedPages = pages.rows.map((row) => {
      return {
        ...row,
        isIndexed: true,
        path: new URL(row.page).pathname,
        siteId,
      }
    }) as any as SiteUrlSelect[]

    const urls: SiteUrlSelect[] = [
      ...sitemapUrls,
    ]
    // conditionally add or update using indexed pages
    for (const indexedPage of indexedPages) {
      const existingIdx = urls.findIndex(u => u.path === indexedPage.path)
      if (existingIdx !== -1)
        // slice in existing
        urls[existingIdx] = indexedPage
      else
        urls.push(indexedPage)
    }

    console.log({ sitemapUrls, indexedPages, urls })
    // iterate over sitemap pages and indexed pages, prefer if they're indexed

    await db.batch(urls.map(row => db.insert(siteUrls).values(row)))

    // queue top 3 pages to have their performance scanned
    // TODO only after they have selected it as a site
    await Promise.all(
      urls
        .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
        .slice(0, 2)
        .map(row => [
          mq.message('/api/_mq/ingest/site/psi', {
            siteId: site.siteId,
            page: row.page,
            strategy: 'mobile',
          }),
          mq.message('/api/_mq/ingest/site/psi', {
            siteId: site.siteId,
            page: row.page,
            strategy: 'desktop',
          }),
        ]).flat(),
    )
  }

  const nitro = useNitroApp()
  await nitro.hooks.callHook(`ws:message:${userId}`, { event: 'site-synced', payload: { siteId } })
  return 'OK'
})
