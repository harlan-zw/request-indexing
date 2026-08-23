import type { H3Event } from 'h3'
import type { DataForSeoSpendEnv } from './dataforseo-spend'
import { DATAFORSEO_RETRY_OPTIONS } from '../../../../../shared/dataforseo'
import { dataForSeoSpendEnv, recordDataForSeoSpend } from './dataforseo-spend'

export interface DataForSeoCallContext extends DataForSeoSpendEnv {
  /** Tool name for spend attribution, e.g. 'check-index'. Omitted = unmetered. */
  tool?: string
  /** Request event, for the caller-IP hash on the ledger row. */
  event?: H3Event
}

/**
 * Build the per-call context the route seam hands to every service function:
 * the spend env plus attribution. `tool` omitted means the call is internal and
 * still metered through the shared budget (env only, no ledger attribution).
 */
export function dataForSeoCallContext(tool: string, event?: H3Event): DataForSeoCallContext {
  return { tool, event, ...dataForSeoSpendEnv() }
}

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

interface SerpTaskResult {
  total?: number
  items?: SerpResult[]
}

interface DataForSeoResponse<T> {
  status_code?: number
  cost?: number
  tasks?: Array<{ result?: T[], cost?: number }>
}

interface DomainRankResult {
  items?: Array<{
    metrics?: { organic?: { etv?: number, count?: number } }
  }>
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

/**
 * One POST to a live endpoint: transport + spend record. Every call to the
 * shared account goes through here, so every batch lands in the
 * `dataforseo_requests` ledger with the provider's measured cost. The meter is
 * best-effort and never fails the call: the budget GATE runs at the route seam
 * before the provider is reached.
 */
async function dataforseoFetch<T>(endpoint: string, body: Record<string, unknown>[], ctx?: DataForSeoCallContext): Promise<T> {
  try {
    const data = await $fetch<DataForSeoResponse<T>>(`https://api.dataforseo.com/v3${endpoint}`, {
      ...DATAFORSEO_RETRY_OPTIONS,
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body,
    })
    if (ctx?.tool) {
      // `cost` is USD for the tasks this response actually served.
      void recordDataForSeoSpend(
        { tool: ctx.tool, endpoint, taskCount: body.length },
        { httpStatus: 200, costUsdMicros: typeof data.cost === 'number' ? Math.round(data.cost * 1e6) : null },
        ctx,
      )
    }
    return data as T
  }
  catch (err: any) {
    const httpStatus = typeof err?.statusCode === 'number' ? err.statusCode : typeof err?.response?.status === 'number' ? err.response.status : 0
    if (ctx?.tool) {
      // Failed transport: no body, provider charges nothing, but the attempt
      // is still evidence — a 402 storm here is how the account running dry
      // was first noticed.
      void recordDataForSeoSpend(
        { tool: ctx.tool, endpoint, taskCount: body.length },
        { httpStatus, costUsdMicros: null },
        ctx,
      )
    }
    throw err
  }
}

export async function checkUrlIndexed(url: string, ctx?: DataForSeoCallContext): Promise<IndexCheckResult> {
  const data = await dataforseoFetch<DataForSeoResponse<SerpTaskResult>>('/serp/google/organic/live/advanced', [
    {
      keyword: `site:${url}`,
      location_code: 2840, // US
      language_code: 'en',
      depth: 10,
    },
  ], ctx)

  const task = data?.tasks?.[0]
  const result = task?.result?.[0]
  const items = (result?.items || []).filter(item => item.type === 'organic')

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

export async function checkUrlsIndexed(urls: string[], ctx?: DataForSeoCallContext): Promise<IndexCheckResult[]> {
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
    const data = await dataforseoFetch<DataForSeoResponse<SerpTaskResult>>('/serp/google/organic/live/advanced', batch, ctx)

    for (let j = 0; j < batch.length; j++) {
      const task = data?.tasks?.[j]
      const result = task?.result?.[0]
      const items = (result?.items || []).filter(item => item.type === 'organic')
      const url = urls[i + j]!
      const normalizedUrl = url.replace(/\/$/, '').toLowerCase()

      const match = items.find((item) => {
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

export async function getDomainOverview(domain: string, ctx?: DataForSeoCallContext): Promise<DomainOverviewResult> {
  // Get estimated indexed pages via site: query
  const siteData = await dataforseoFetch<DataForSeoResponse<SerpTaskResult>>('/serp/google/organic/live/advanced', [
    {
      keyword: `site:${domain}`,
      location_code: 2840,
      language_code: 'en',
      depth: 100,
    },
  ], ctx)

  const siteResult = siteData?.tasks?.[0]?.result?.[0]
  const estimatedIndexedPages = siteResult?.total || 0
  const topOrganicPages = (siteResult?.items || [])
    .filter(item => item.type === 'organic')
    .slice(0, 10)
    .map(item => ({
      url: item.url,
      traffic: 0, // SERP data doesn't have traffic, but we show the URL
      keywords: 0,
    }))

  // Get domain metrics via ranked keywords
  let organicTraffic = 0
  let organicKeywords = 0

  try {
    const domainData = await dataforseoFetch<DataForSeoResponse<DomainRankResult>>('/dataforseo_labs/google/domain_rank_overview/live', [
      {
        target: domain,
        location_code: 2840,
        language_code: 'en',
      },
    ], ctx)

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
  const extractLocations = (xml: string) => Array.from(
    xml.matchAll(/<loc>([^<]*)<\/loc>/g),
    match => match[1]?.trim(),
  ).filter((location): location is string => Boolean(location))

  if (response.includes('<sitemapindex')) {
    const childUrls = extractLocations(response)

    for (const childUrl of childUrls.slice(0, 5)) {
      const childResponse = await $fetch<string>(childUrl, { responseType: 'text' }).catch(() => '')
      urls.push(...extractLocations(childResponse))
    }
  }
  else {
    urls.push(...extractLocations(response))
  }

  return urls
}
