import { parseURL, withoutTrailingSlash } from 'ufo'
import { getUserSite, normalizeSiteUrlForKey } from '~/server/utils/storage'
import { fetchGoogleSearchConsoleAnalytics } from '~/server/utils/api/googleSearchConsole'
import type { NitroAuthData, SiteAnalytics, SiteExpanded } from '~/types'
import { fetchRobots, fetchSitemapUrls } from '~/server/utils/crawler/crawl'

const fetchSite = cachedFunction<SiteAnalytics, [NitroAuthData, string, boolean]>(
  async ({ tokens, user }: NitroAuthData, siteUrl: string) => {
    const periodRange = user.analyticsPeriod || { days: 28 }
    return await fetchGoogleSearchConsoleAnalytics(tokens, periodRange, siteUrl, user.access === 'pro' ? 100001 : 2500)
  },
  {
    maxAge: 60 * 60 * 6, // cache for 6 hours
    group: 'app',
    name: 'user',
    shouldInvalidateCache(_, force?: boolean) {
      return !!force || import.meta.dev
    },
    getKey({ user }: NitroAuthData, siteUrl: string) {
      return `${user.userId}:sites:${normalizeSiteUrlForKey(siteUrl)}:analytics:${user.analyticsPeriod}`
    },
  },
)

export default defineEventHandler(async (event) => {
  const { user } = event.context.authenticatedData
  const { siteUrl } = getRouterParams(event, { decode: true })

  // TODO throttle force?
  const force = String(getQuery(event).force) === 'true'

  const sites = await fetchSitesCached(event.context.authenticatedData, force)
  const site = sites.find(s => s.siteUrl === siteUrl)
  if (!site) {
    return sendError(event, createError({
      statusCode: 404,
      message: 'Site not found',
    }))
  }

  const googleSearchConsoleAnalytics = await fetchSite(event.context.authenticatedData, siteUrl, force)

  // compute the non-indexed urls
  const { indexedUrls, period, sitemaps } = googleSearchConsoleAnalytics

  if (user.access !== 'pro' && period.length >= 2500) {
    return {
      ...site,
      ...googleSearchConsoleAnalytics,
      nonIndexedPercent: -1,
      nonIndexedUrls: [],
    } satisfies SiteExpanded
  }

  const indexedPaths = indexedUrls.map(url => withoutTrailingSlash(parseURL(url).pathname))
  const siteCacheKey = `user:${user.userId}:sites:${normalizeSiteUrlForKey(siteUrl)}`
  const robots = await fetchRobots({
    cacheKey: siteCacheKey,
    siteUrl,
  })
  const sitemapPaths = sitemaps!.map(s => s.path).filter(Boolean) as string[]
  const nonIndexedUrls = new Set<string>()
  // easy case
  const sitemapsUrls = sitemapPaths.length
    ? await fetchSitemapUrls({
      cacheKey: siteCacheKey,
      robots,
      siteUrl,
      sitemapPaths,
    })
    : []
  sitemapsUrls
    .map(url => withoutTrailingSlash(parseURL(url).pathname))
    .filter(url => !indexedPaths.includes(url))
    // .filter(u => u !== '/') // some trailing slash issues, should fix properly
    .forEach(url => nonIndexedUrls.add(url))

  const { urls } = await getUserSite(user.userId, siteUrl)
  return {
    ...site,
    ...googleSearchConsoleAnalytics,
    nonIndexedPercent: indexedUrls.length / (indexedUrls.length + [...nonIndexedUrls].length),
    nonIndexedUrls: [...nonIndexedUrls].map((url) => {
      const entry = urls.filter(Boolean).find(u => parseURL(u.url).pathname === url)
      return {
        ...entry,
        url,
      }
    }),
  } satisfies SiteExpanded
})
