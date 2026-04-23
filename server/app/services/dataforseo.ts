interface DataForSEOCredentials {
  login: string
  password: string
}

interface SerpResult {
  url: string
  title: string
  description: string
  position: number
  type: string
}

interface SerpResponse {
  keyword: string
  totalResults: number
  items: SerpResult[]
}

export interface IndexCheckResult {
  url: string
  indexed: boolean
  matchedUrl?: string
  matchedTitle?: string
  totalSiteResults?: number
}

export interface DomainOverviewResult {
  domain: string
  organicTraffic: number
  organicKeywords: number
  estimatedIndexedPages: number
  topPages: Array<{ url: string, traffic: number, keywords: number }>
}

function getCredentials(): DataForSEOCredentials {
  const config = useRuntimeConfig()
  return {
    login: config.dataforseo?.login || '',
    password: config.dataforseo?.password || '',
  }
}

function getAuthHeader(): string {
  const { login, password } = getCredentials()
  return `Basic ${btoa(`${login}:${password}`)}`
}

async function dataforseoFetch<T>(endpoint: string, body: unknown): Promise<T> {
  const response = await $fetch<T>(`https://api.dataforseo.com/v3${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body,
  })
  return response
}

export async function checkUrlIndexed(url: string): Promise<IndexCheckResult> {
  const data = await dataforseoFetch<any>('/serp/google/organic/live/advanced', [
    {
      keyword: `site:${url}`,
      location_code: 2840, // US
      language_code: 'en',
      depth: 10,
    },
  ])

  const task = data?.tasks?.[0]
  const result = task?.result?.[0]
  const items: SerpResult[] = (result?.items || [])
    .filter((item: any) => item.type === 'organic')

  const normalizedUrl = url.replace(/\/$/, '').toLowerCase()
  const match = items.find((item: SerpResult) => {
    const itemUrl = item.url.replace(/\/$/, '').toLowerCase()
    return itemUrl === normalizedUrl || itemUrl.startsWith(normalizedUrl)
  })

  return {
    url,
    indexed: items.length > 0,
    matchedUrl: match?.url,
    matchedTitle: match?.title,
    totalSiteResults: result?.total || 0,
  }
}

export async function checkUrlsIndexed(urls: string[]): Promise<IndexCheckResult[]> {
  // DataForSEO allows batching — send multiple tasks in one request
  const tasks = urls.map((url, i) => ({
    keyword: `site:${url}`,
    location_code: 2840,
    language_code: 'en',
    depth: 10,
    tag: `url-${i}`,
  }))

  // DataForSEO has a limit of 100 tasks per request
  const batchSize = 100
  const results: IndexCheckResult[] = []

  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize)
    const data = await dataforseoFetch<any>('/serp/google/organic/live/advanced', batch)

    for (let j = 0; j < batch.length; j++) {
      const task = data?.tasks?.[j]
      const result = task?.result?.[0]
      const items = (result?.items || []).filter((item: any) => item.type === 'organic')
      const url = urls[i + j]!
      const normalizedUrl = url.replace(/\/$/, '').toLowerCase()

      const match = items.find((item: any) => {
        const itemUrl = item.url.replace(/\/$/, '').toLowerCase()
        return itemUrl === normalizedUrl || itemUrl.startsWith(normalizedUrl)
      })

      results.push({
        url,
        indexed: items.length > 0,
        matchedUrl: match?.url,
        matchedTitle: match?.title,
        totalSiteResults: result?.total || 0,
      })
    }
  }

  return results
}

export async function getDomainOverview(domain: string): Promise<DomainOverviewResult> {
  // Get estimated indexed pages via site: query
  const siteData = await dataforseoFetch<any>('/serp/google/organic/live/advanced', [
    {
      keyword: `site:${domain}`,
      location_code: 2840,
      language_code: 'en',
      depth: 100,
    },
  ])

  const siteResult = siteData?.tasks?.[0]?.result?.[0]
  const estimatedIndexedPages = siteResult?.total || 0
  const topOrganicPages = (siteResult?.items || [])
    .filter((item: any) => item.type === 'organic')
    .slice(0, 10)
    .map((item: any) => ({
      url: item.url,
      traffic: 0, // SERP data doesn't have traffic, but we show the URL
      keywords: 0,
    }))

  // Get domain metrics via ranked keywords
  let organicTraffic = 0
  let organicKeywords = 0

  try {
    const domainData = await dataforseoFetch<any>('/dataforseo_labs/google/domain_rank_overview/live', [
      {
        target: domain,
        location_code: 2840,
        language_code: 'en',
      },
    ])

    const domainResult = domainData?.tasks?.[0]?.result?.[0]?.items?.[0]
    if (domainResult) {
      organicTraffic = domainResult.metrics?.organic?.etv || 0
      organicKeywords = domainResult.metrics?.organic?.count || 0
    }
  }
  catch {
    // Domain rank overview may not be available for all domains
  }

  return {
    domain,
    organicTraffic: Math.round(organicTraffic),
    organicKeywords,
    estimatedIndexedPages,
    topPages: topOrganicPages,
  }
}

export async function fetchSitemapUrlsFromXml(sitemapUrl: string): Promise<string[]> {
  const response = await $fetch<string>(sitemapUrl, { responseType: 'text' })
  const urls: string[] = []

  if (response.includes('<sitemapindex')) {
    const sitemapMatches = response.match(/<loc>\s*(.*?)\s*<\/loc>/g) || []
    const childUrls = sitemapMatches.map(m => m.replace(/<\/?loc>/g, '').trim())

    for (const childUrl of childUrls.slice(0, 5)) {
      const childResponse = await $fetch<string>(childUrl, { responseType: 'text' }).catch(() => '')
      const childMatches = childResponse.match(/<loc>\s*(.*?)\s*<\/loc>/g) || []
      urls.push(...childMatches.map(m => m.replace(/<\/?loc>/g, '').trim()))
    }
  }
  else {
    const matches = response.match(/<loc>\s*(.*?)\s*<\/loc>/g) || []
    urls.push(...matches.map(m => m.replace(/<\/?loc>/g, '').trim()))
  }

  return urls
}
