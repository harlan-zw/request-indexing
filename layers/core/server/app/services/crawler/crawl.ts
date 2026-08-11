import type { ParsedRobotsTxt } from './robotsTxt'
import { $fetch } from 'ofetch'
import { withBase } from 'ufo'
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

  const res = await $fetch.raw(url).catch(() => null)
  if (!res)
    return { indexable: false, reason: 'error response' }

  const headers = res.headers as unknown as { get?: (k: string) => string | null } & Record<string, string>
  const getHeader = (key: string): string => (typeof headers.get === 'function' ? (headers.get(key) ?? '') : (headers[key] ?? ''))

  // check meta tag
  const tag = getHeader('x-robots-tag')
  if (tag.includes('noindex'))
    return { indexable: false, reason: 'x-robots-tag header' }

  // see if we were redirected
  const location = getHeader('location')
  if (location && location !== url)
    return { indexable: false, reason: 'redirect' }

  const html = String(res._data ?? '')

  // check for robots meta tag blocking page, need to use regex here
  // tag may have noindex, but also "noindex, nofollow" or "nofollow, noindex"
  if (/<meta[^>]+name="robots"[^>]+content="[^"]*noindex[^"]*"[^>]*>/.test(html))
    return { indexable: false, reason: 'robots meta tag' }

  // check canonical tag
  const canonical = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/)
  if (canonical && canonical[1] !== url)
    return { indexable: false, reason: 'canonical URL different' }

  // parse the page and extract all a tag hrefs that start with a / OR start with the site url
  const links = (html.match(/<a[^>]+href="([^"]+)"/g) || [])
    .map((a: string) => (a.match(/href="([^"]+)"/) || [])[1] || '')
    .filter((href: string) => href.startsWith('/') || href.startsWith(options.siteUrl))
    .map((href: string) => href.startsWith('/') ? href : new URL(href).pathname)
    // exclude files
    .filter((href: string) => !(href.split('/').pop() || '').includes('.'))
    // exclude hash or query strings
    .filter((href: string) => !href.includes('#') && !href.includes('?'))
    .filter((href: string) => options.isValidPath ? options.isValidPath(href) : true)
  return { indexable: true, links }
}

export async function fetchRobots(options: { siteUrl: string }) {
  const robotsTxt = await $fetch('/robots.txt', {
    baseURL: options.siteUrl,
  }).catch(() => `User-agent: *\nDisallow:`) // allow everything by default
  return parseRobotsTxt(robotsTxt)
}

/**
 * Fetches routes from a sitemap file.
 */
export async function fetchSitemapUrls(options: { siteUrl: string, sitemapPaths: string[], robots?: ParsedRobotsTxt }) {
  const sitemaps = options.sitemapPaths || options.robots?.sitemaps || []
  // make sure we're working from the host name
  const { default: Sitemapper } = await import('sitemapper')
  const sitemapper = new Sitemapper({
    timeout: 15000, // 15 seconds
  })
  // if it's empty then the user hasn't submitted there sitemap, but they may still have one
  if (!sitemaps.length) {
    const robots = options.robots || await fetchRobots(options)
    sitemaps.push(...robots.sitemaps)
  }
  if (!sitemaps.length)
    sitemaps.push(withBase('/sitemap.xml', options.siteUrl))
  return (await Promise.all([...(new Set(sitemaps))]
    .map(async (url) => {
      const isTxt = url.endsWith('.txt')
      if (isTxt) {
        return await $fetch(url, { responseType: 'text' })
          .then(r => ({ url, sites: String(r).trim().split('\n') }))
          .catch((err: { message: string }) => ({ url, sites: [], errors: [{ type: err.message, url }] }))
      }
      return await sitemapper.fetch(url)
    })))
    .filter(Boolean)
    .flat()
}
