import { defineEventHandler } from 'h3'
import { withHttps } from 'ufo'
import { createGscClientFromEvent } from '~/server/app/services/gsc'
import { useAuthenticatedUser } from '~/server/app/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await useAuthenticatedUser(event)
  const gsc = await createGscClientFromEvent(event)

  const { site } = gsc

  const pages = [] // await userGoogleSearchConsoleStorage(user.userId, site.domain).getItem<GscDataRow[]>(`pages.json`)

  const siteCacheKey = `user:${user.userId}:sites:${normalizeUrlStorageKey(site.domain)}`
  const robots = await fetchRobots({
    cacheKey: siteCacheKey,
    siteUrl: site.domain, // TODO check subdomain
  })
  const sitemapPaths = site.sitemaps!.map(s => s.path).filter(Boolean) as string[]
  // for each domain, check if we have a sitemap, otherwise include it
  if (!sitemapPaths.length)
    sitemapPaths.push(`${withHttps(site.domain)}/sitemap.xml`) // maybe it exists
  const nonIndexedUrls = new Set<string>()
  // easy case
  const sitemapsResponses = await fetchSitemapUrls({
    cacheKey: siteCacheKey,
    robots,
    siteUrl: site.domain,
    sitemapPaths,
  })
  // need to flattern urls
  sitemapsResponses.map((entry) => {
    return entry.sites.map(site => ({
      url: site,
      sitemap: entry.url,
    }))
  })
    .flat()
    .forEach((url) => {
      if (!pages!.some(p => p.url === url.url))
        nonIndexedUrls.add(url.url)
    })

  // const { urlInspections } = await getUserSite(user.userId, site.domain)
  return [...nonIndexedUrls].map((url) => {
    return { url }
  })
})
