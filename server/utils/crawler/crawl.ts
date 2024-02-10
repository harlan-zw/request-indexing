import { $fetch } from 'ofetch'
import { withBase } from 'ufo'
import Sitemapper from 'sitemapper'
import type { ParsedRobotsTxt } from './robotsTxt'
import { parseRobotsTxt } from './robotsTxt'

export interface CrawlOptions {
  robots: ParsedRobotsTxt
  siteUrl: string
}

export async function crawlSite(options: CrawlOptions) {
  // hard path, we need to manually crawl the site, some rules:
  // 1. we respect canonical URLs, don't include pages that have a different canonical URL
  // 2. we respect robots meta tag and x-robots-tag headers
  // 3. we respect robots.txt

  // first we need to make a queue worker where we can batch pages in chunks of 10
  // we'll use a set to keep track of visited pages
  const visited = new Set<string>()
  const queue = new Set<string>()

  // we'll add home page to the queue first and add any URLs it discovered to be processed by the queue
  queue.add('/')

  // now work the queue, 200 hard cap
  while (queue.size || visited.size > 200) {
    // need to work queue in 5 so take 5 from the queue (or however many are left)
    const chunk = Array.from(queue).slice(0, 5)
    // remove the chunk from the queue
    chunk.forEach((url) => {
      visited.add(url)
      queue.delete(url)
    })
    // process the chunk
    const chunkResults = (await Promise.all(chunk.map(
      url => processPage({
        siteUrl: options.siteUrl,
        url,
        // we want to scan at least some pages, so we'll allow the first 5 to be scanned
        // isValidPath: path => (visited.size < 5) || !options.excludePaths.includes(path),
        robots: options.robots,
      }),
    ))) as { indexable: boolean, reason: string, links?: string[] }[]
    // add the results to the queue
    chunkResults
      .filter(({ indexable }) => indexable)
      .forEach((results) => {
        results.links!.forEach(url => !visited.has(url) && queue.add(url))
      })
  }
  return [...visited]
}

export async function processPage(options: { robots: ParsedRobotsTxt, url: string, siteUrl: string, isValidPath?: (path: string) => boolean }) {
  const url = options.url === '/' ? options.siteUrl : withBase(options.url, options.siteUrl)
  options.siteUrl = options.siteUrl.replace('sc-domain:', 'https://')
  if (!url.startsWith(options.siteUrl))
    return { indexable: false, reason: 'wrong domain' }

  // avoid making a request if the URL is not allowed by robots.txt
  if (!options.robots.test(url))
    return { indexable: false, reason: 'robots.txt' }

  const res = await $fetch.raw(url)
    .catch(() => {
      return { indexable: false, reason: 'error response' }
    })
  if (res.indexable === false)
    return res

  // check meta tag
  const tag = res.headers['x-robots-tag'] || res.headers['x-robots-tag'] || ''
  if (tag.includes('noindex'))
    return { indexable: false, reason: 'x-robots-tag header' }

  // see if we were redirected
  if (res.headers.location && res.headers.location !== url)
    return { indexable: false, reason: 'redirect' }

  const html = res._data

  // check for robots meta tag blocking page, need to use regex here
  // tag may have noindex, but also "noindex, nofollow" or "nofollow, noindex"
  if (/<meta[^>]+name="robots"[^>]+content="[^"]*noindex[^"]*"[^>]*>/.test(html))
    return { indexable: false, reason: 'robots meta tag' }

  // check canonical tag
  const canonical = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/)
  if (canonical && canonical[1] !== url)
    return { indexable: false, reason: 'canonical URL different' }

  // parse the page and extract all a tag hrefs that start with a / OR start with the site url
  const links = res._data.match(/<a[^>]+href="([^"]+)"/g)
    .map(a => a.match(/href="([^"]+)"/)[1])
    .filter(href => href.startsWith('/') || href.startsWith(options.siteUrl))
    .map(href => href.startsWith('/') ? href : new URL(href).pathname)
    // exclude files
    .filter(href => !href.split('/').pop().includes('.'))
    // exclude hash or query strings
    .filter(href => !href.includes('#') && !href.includes('?'))
    .filter(href => options.isValidPath ? options.isValidPath(href) : true)
  return { indexable: true, links }
}

export async function fetchRobots(options: { cacheKey: string, siteUrl: string }) {
  const fetchRobotsCached = cachedFunction<string>(async () => {
    return await $fetch('/robots.txt', {
      baseURL: options.siteUrl,
    }).catch(() => `User-agent: *\nDisallow:`) // allow everything by default
  }, {
    group: 'app',
    maxAge: 60 * 60, // 1 hour
    name: options.cacheKey,
    getKey: () => 'robots',
  })

  return parseRobotsTxt(await fetchRobotsCached())
}

/**
 * Fetches routes from a sitemap file.
 */
export async function fetchSitemapUrls(options: { cacheKey: string, siteUrl: string, sitemapPaths: string[], robots?: ParsedRobotsTxt }) {
  const sitemaps = options.sitemapPaths || options.robots?.sitemaps || []
  if (!sitemaps.length)
    sitemaps.push('/sitemap.xml')
  // make sure we're working from the host name
  const sitemap = new Sitemapper({
    timeout: 15000, // 15 seconds
  })

  return cachedFunction<string[]>(async () => {
    return (await Promise.all([...(new Set(sitemaps))]
      .map(async (url) => {
        const abs = withBase(url, options.siteUrl)
        const isTxt = url.endsWith('.txt')
        if (isTxt) {
          return await $fetch<string>(abs)
            .then(text => text.trim().split('\n'))
            .catch(() => [])
        }
        return await sitemap.fetch(abs).then(r => r.sites).catch(() => [])
      })))
      .filter(Boolean)
      .flat()
  }, {
    name: options.cacheKey,
    group: 'app',
    getKey: () => 'sitemap',
    maxAge: 60 * 60, // 1 hour
  })()
}
