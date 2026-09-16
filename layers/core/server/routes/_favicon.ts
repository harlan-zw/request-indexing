import type { H3Event } from 'h3'
import { Buffer } from 'node:buffer'

/**
 * Serves the favicon for a connected site. `SiteFavicon.vue` points every site
 * card at `/_favicon?domain=<host>`.
 *
 * This route used to proxy `https://www.google.com/s2/favicons`. That endpoint
 * now 301s to `t0.gstatic.com`, which answers 404 with a generic globe PNG for
 * any site without an icon. The proxy passed the 404 through, so the image
 * always failed and the dashboard logged one 404 per site per page load. This
 * route now normalises every outcome to 200 with an image body.
 */

/** A hostname that passed `parseFaviconHost`. Trusted from here inward. */
interface FaviconHost {
  readonly _tag: 'FaviconHost'
  readonly value: string
}

type ParsedHost
  = | { _tag: 'Ok', host: FaviconHost }
    | { _tag: 'Err', reason: HostRejection }

type HostRejection
  = | 'missing'
    | 'empty'
    | 'too-long'
    | 'ip-literal'
    | 'malformed'
    | 'blocked-suffix'

type ResolvedIcon
  = | { _tag: 'Icon', body: ArrayBuffer, contentType: string }
    | { _tag: 'NoIcon', reason: 'redirect' | 'resolver-status' | 'not-an-image' | 'network' }

/** Cached icon bytes. KV holds strings, so the body is base64. */
interface CachedIcon {
  readonly contentType: string
  /** Base64 icon bytes. Empty means the resolver has no icon for this host. */
  readonly base64: string
  readonly fetchedAt: number
}

/** Google resolves the icon. It needs no credentials and runs on Workers. */
const ICON_RESOLVER = 'https://t0.gstatic.com/faviconV2'

const ICON_SIZE = 64

/** Cache key prefix. Raise the version to drop every stored icon. */
const CACHE_PREFIX = 'favicon:v1:'

/** A cached icon is re-fetched after 30 days. */
const ICON_CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

/** A cached miss is re-fetched after 1 day, so a new favicon appears sooner. */
const MISS_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000

// Storage-level expiry, in seconds. The read-time freshness check above
// decides what to serve; these stop the namespace growing without bound.
// The host comes from the query and the route needs no session, so any caller
// can mint new keys. Each TTL sits above its max age, so freshness still wins.
const ICON_CACHE_TTL_S = 35 * 24 * 60 * 60
const MISS_CACHE_TTL_S = 2 * 24 * 60 * 60

/** Hostnames under these suffixes name internal networks. Never fetch them. */
const BLOCKED_SUFFIXES = new Set([
  'arpa',
  'corp',
  'home',
  'internal',
  'intranet',
  'invalid',
  'lan',
  'local',
  'localdomain',
  'localhost',
  'onion',
  'test',
])

/** One or more labels, then an alphabetic TLD. IP literals fail this test. */
const HOSTNAME_PATTERN = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/

const IPV4_PATTERN = /^\d{1,3}(?:\.\d{1,3}){3}$/

/** The fallback icon. A neutral globe, so a failed lookup still renders. */
const FALLBACK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`

/**
 * Parses the untrusted `domain` query value into a hostname.
 *
 * The route fetches whatever this returns, so the parse blocks IP literals and
 * internal suffixes. That stops the endpoint probing private services.
 */
export function parseFaviconHost(raw: unknown): ParsedHost {
  if (typeof raw !== 'string')
    return { _tag: 'Err', reason: 'missing' }

  let value = raw.trim().toLowerCase()

  // Search Console properties arrive as `sc-domain:example.com`.
  if (value.startsWith('sc-domain:'))
    value = value.slice('sc-domain:'.length)

  // Drop a scheme, then any path, query, or fragment.
  value = value.replace(/^[a-z][a-z0-9+.-]*:\/\//, '')
  value = value.split('/')[0]!.split('?')[0]!.split('#')[0]!

  // Drop credentials. `user:pass@host` keeps only the host.
  const atIndex = value.lastIndexOf('@')
  if (atIndex !== -1)
    value = value.slice(atIndex + 1)

  // Drop a port. A colon left after this means an IPv6 literal or junk.
  value = value.replace(/:\d+$/, '')

  // Drop the root label of a fully qualified name.
  value = value.replace(/\.$/, '')

  if (!value)
    return { _tag: 'Err', reason: 'empty' }

  if (value.length > 253)
    return { _tag: 'Err', reason: 'too-long' }

  // IPv4 and IPv6 literals can address private and link-local ranges.
  if (IPV4_PATTERN.test(value) || value.includes(':') || value.includes('['))
    return { _tag: 'Err', reason: 'ip-literal' }

  // `localhost` and every bare single label fail here too.
  if (!HOSTNAME_PATTERN.test(value))
    return { _tag: 'Err', reason: 'malformed' }

  const tld = value.slice(value.lastIndexOf('.') + 1)
  if (BLOCKED_SUFFIXES.has(tld))
    return { _tag: 'Err', reason: 'blocked-suffix' }

  return { _tag: 'Ok', host: { _tag: 'FaviconHost', value } }
}

/**
 * Fetches the icon for one host from the resolver.
 *
 * `fetchImpl` is an argument so the resolver stays an explicit dependency.
 */
export async function resolveIcon(host: FaviconHost, fetchImpl: typeof globalThis.fetch): Promise<ResolvedIcon> {
  const url = new URL(ICON_RESOLVER)
  url.searchParams.set('client', 'SOCIAL')
  url.searchParams.set('type', 'FAVICON')
  url.searchParams.set('fallback_opts', 'TYPE,SIZE,URL')
  url.searchParams.set('url', `https://${host.value}`)
  url.searchParams.set('size', String(ICON_SIZE))

  // The resolver must answer directly. A redirect can point at another host,
  // and this request carries a user-supplied domain, so never follow one.
  const response = await fetchImpl(url, {
    redirect: 'manual',
    headers: { accept: 'image/*' },
  }).catch((error: unknown) => {
    // The resolver is a third party. Log the failure, then fall back.
    console.error('[_favicon] icon resolver request failed', { host: host.value, error })
    return null
  })

  if (!response)
    return { _tag: 'NoIcon', reason: 'network' }

  if (response.status >= 300 && response.status < 400)
    return { _tag: 'NoIcon', reason: 'redirect' }

  // The resolver answers 404 with a generic globe when a site has no icon.
  if (!response.ok)
    return { _tag: 'NoIcon', reason: 'resolver-status' }

  const contentType = response.headers.get('content-type') || ''
  if (!contentType.startsWith('image/'))
    return { _tag: 'NoIcon', reason: 'not-an-image' }

  return { _tag: 'Icon', body: await response.arrayBuffer(), contentType: contentType.split(';')[0]!.trim() }
}

function isFresh(entry: CachedIcon, now: number): boolean {
  const maxAge = entry.base64 ? ICON_CACHE_MAX_AGE_MS : MISS_CACHE_MAX_AGE_MS
  return now - entry.fetchedAt < maxAge
}

export default defineEventHandler(async (event) => {
  const parsed = parseFaviconHost(getQuery(event).domain)

  if (parsed._tag === 'Err')
    return sendFallback(event, parsed.reason)

  const host = parsed.host
  const storage = useStorage('cache')
  const cacheKey = `${CACHE_PREFIX}${host.value}`
  const now = Date.now()

  const cached = await storage.getItem<CachedIcon>(cacheKey).catch((error: unknown) => {
    // A cache read failure must not fail the request. Log it, then re-fetch.
    console.error('[_favicon] cache read failed', { host: host.value, error })
    return null
  })

  if (cached && isFresh(cached, now)) {
    return cached.base64
      ? sendIcon(event, Buffer.from(cached.base64, 'base64'), cached.contentType)
      : sendFallback(event, 'cached-miss')
  }

  const resolved = await resolveIcon(host, globalThis.fetch)

  const entry: CachedIcon = resolved._tag === 'Icon'
    ? { contentType: resolved.contentType, base64: Buffer.from(resolved.body).toString('base64'), fetchedAt: now }
    : { contentType: 'image/svg+xml', base64: '', fetchedAt: now }

  // A network failure is transient, so do not cache it as a miss.
  if (resolved._tag === 'Icon' || resolved.reason !== 'network') {
    const ttl = entry.base64 ? ICON_CACHE_TTL_S : MISS_CACHE_TTL_S
    await storage.setItem(cacheKey, entry, { ttl }).catch((error: unknown) => {
      // A cache write failure only costs a re-fetch. Log it, then serve.
      console.error('[_favicon] cache write failed', { host: host.value, error })
    })
  }

  return resolved._tag === 'Icon'
    ? sendIcon(event, Buffer.from(resolved.body), resolved.contentType)
    : sendFallback(event, resolved.reason)
})

function sendIcon(event: H3Event, body: Buffer, contentType: string) {
  setResponseHeader(event, 'content-type', contentType)
  setResponseHeader(event, 'cache-control', 'public, max-age=86400, s-maxage=2592000, stale-while-revalidate=604800')
  setResponseHeader(event, 'x-favicon-source', 'resolver')
  return body
}

/**
 * Always answers 200 with the fallback icon.
 *
 * A 404 here made the browser log an error for every site on every page load.
 * `reason` ships as a header so the cause stays visible in the network tab.
 */
function sendFallback(event: H3Event, reason: string) {
  setResponseHeader(event, 'content-type', 'image/svg+xml; charset=utf-8')
  setResponseHeader(event, 'cache-control', 'public, max-age=3600, stale-while-revalidate=86400')
  setResponseHeader(event, 'x-favicon-source', 'fallback')
  setResponseHeader(event, 'x-favicon-reason', reason)
  return FALLBACK_ICON
}
