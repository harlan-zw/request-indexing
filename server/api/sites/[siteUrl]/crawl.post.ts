export default defineEventHandler(async () => {
  // TODO re-implement
  // const { tokens, user } = event.context.authenticatedData
  //
  // const { siteUrl } = getRouterParams(event, { decode: true })

  // const googleSearchConsoleAnalytics = await fetchGoogleSearchConsoleAnalytics(
  //   tokens,
  //   user.analyticsPeriod,
  //   siteUrl,
  // )
  //
  // const { indexedUrls } = googleSearchConsoleAnalytics
  //
  // const indexedPaths = indexedUrls.map(url => withoutTrailingSlash(parseURL(url).pathname))
  //
  // const siteCacheKey = `user:${user.userId}:sites:${normalizeSiteUrlForKey(siteUrl)}`
  // const robots = await fetchRobots({
  //   cacheKey: siteCacheKey,
  //   siteUrl,
  // })
  //
  // const nonIndexedUrls = new Set<string>()
  //
  // const { crawl } = await getUserSite(user.userId, siteUrl)
  // let crawledUrls: string[] = []
  // // cache
  // crawledUrls = (await crawlSite({
  //   robots,
  //   siteUrl: normalizeSiteUrl(siteUrl),
  // }))
  // await crawlStorage.setItem('', { updatedAt: Date.now(), urls: crawledUrls })
  // crawledUrls
  //   .filter(url => !indexedPaths.includes(url))
  //   .forEach(url => nonIndexedUrls.add(url))

  // interface CrawlCache { updatedAt: number, urls: string[] }
  // const crawlStorage = userSiteAppStorage<CrawlCache>(user.userId, siteUrl, 'crawledUrls')
  // let crawledUrls: string[] = []
  // if (crawl) {
  //   // cache
  //   crawledUrls = (await crawlSite({
  //     robots,
  //     siteUrl: normalizedSiteUrl(siteUrl),
  //   }))
  //   await crawlStorage.setItem('', { updatedAt: Date.now(), urls: crawledUrls })
  // }
  // else {
  //   const hasCrawlCached = await crawlStorage.hasItem(``)
  //   if (hasCrawlCached) {
  //     const cachedCrawl = await crawlStorage.getItem(``)
  //     crawledUrls = cachedCrawl?.urls || []
  //     res.lastCrawl = cachedCrawl?.updatedAt
  //   }
  //   else if (!sitemapsUrls.length && !crawl) {
  //     res.needsCrawl = true
  //   }
  // }
  // crawledUrls
  //   .filter(url => !indexedPaths.includes(url))
  //   .forEach(url => nonIndexedUrls.add(url))
  return []
})
