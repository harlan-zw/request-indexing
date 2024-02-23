import { parseURL } from 'ufo'
import dayjs from 'dayjs'
import type { User } from '~/types'
import {
  fetchGSCDates,
  fetchGSCPages,
  fetchGscSitesWithSitemaps,
} from '~/server/app/services/gsc'

export default defineEventHandler(async (event) => {
  const { user } = await readBody<User>(event)
  const { tokens } = await getUserToken(user.userId, 'login') || {}

  const storage = await userAppStorage(user.userId, `sites`)
  // if we're resyncing the file needs to be removed first for safety
  if (await storage.hasItem(`sites.json`))
    return 'OK'

  const _sites = await fetchGscSitesWithSitemaps(tokens)
  const startDate = dayjs().subtract(17, 'month').toDate()
  const endDate = dayjs().subtract(16, 'month').toDate()
  const sites = await Promise.all(_sites.map(async (s) => {
    const dates = await fetchGSCDates(tokens, {
      period: {
        start: startDate,
        end: endDate,
      },
    }, s)
    // if the date is 16 months ago then they're losing data
    const isLosingData = dates.length > 0
    return {
      isLosingData,
      startOfData: dates.length ? dates[0].keys![0] : undefined, // we'll need to do a full scan of the dates
      domain: s.siteUrl.replace('sc-domain:', '').replace('https://', ''),
      ...s,
    }
  }))
  // dedupe based on domain
  const dedupedSites = sites.reduce((acc, site) => {
    if (acc.find(s => s.domain === site.domain))
      return acc

    return [...acc, site]
  }, [] as typeof sites)
  const appendSites: typeof sites = []
  for (const site of dedupedSites) {
    if (site.siteUrl.startsWith('sc-domain')) {
      // we need to fetch pages for last 30 days to figure out subdomains
      // TODO parralel
      const start = dayjs().subtract(28, 'day').toDate()
      const end = dayjs().subtract(1, 'day').toDate()
      const pages = await fetchGSCPages(tokens, { period: { start, end } }, site.siteUrl)
      ;[...new Set(pages.map((p) => {
        return parseURL(p.keys![0]).host
      }))].filter(Boolean).forEach((s) => {
        const index = sites.findIndex(d => d.domain === s)
        if (index === -1) {
          appendSites.push({
            ...site,
            // filter sitemaps for subdomain
            sitemaps: site.sitemaps?.filter(sitemap => sitemap.path.replace('https://', '').startsWith(s)),
            domain: s!,
            pageCount30Day: pages.filter(p => parseURL(p.keys![0]).host === s).length,
          })
        }
        else {
          sites[index].pageCount30Day = pages.filter(p => parseURL(p.keys![0]).host === s).length
        }
      })
    }
  }
  const finalSites = [
    ...appendSites,
    ...sites,
  ].sort((a, b) => a.siteUrl.localeCompare(b.siteUrl))
  await storage.setItem(`sites.json`, finalSites)
  return 'OK'
})
