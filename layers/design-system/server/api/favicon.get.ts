import { createError, defineEventHandler, getQuery, setResponseHeader, setResponseStatus } from 'h3'
/**
 * Same-origin favicon proxy. UiFavicon renders this instead of hitting Google's
 * s2 endpoint directly so the image is (a) cacheable on our edge, (b) decoupled
 * from leaking every user's site list to Google per render, and crucially
 * (c) same-origin — which lets the client sample the favicon on a canvas without
 * a cross-origin taint, the basis for UiFavicon's adaptive backing (see
 * useFaviconBacking). We only ever fetch Google with the domain as a query
 * param, never the supplied host directly, so there is no SSRF surface; the
 * format guard just rejects junk input.
 */
// 1×1 FULLY TRANSPARENT PNG. The previous constant claimed to be this and was
// not: its single pixel decoded to `R=0 G=255 B=0 A=127`, so every mail client
// scaled a half-opaque pure-green swatch to 16px and painted it beside the
// hostname — under a warning headline, where it read as a health dot. Verify
// with a decode, never by looking: at 1×1 the difference is invisible in source
// and obvious in an inbox.
// `?fallback=blank` callers get this with a 200 instead of
// a 404 — an <img> that 404s paints a broken-image glyph in clients with no
// scripted onerror to fall back with (mail, notably), and blank space beats a
// broken icon there. UiFavicon also requests the blank response, then detects
// its 1×1 size and swaps in the initials box without logging a failed request.
const BLANK_PNG = Uint8Array.from(
  atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgAAIAAAUAAXpeqz8AAAAASUVORK5CYII='),
  c => c.charCodeAt(0),
)

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const blankOnMiss = query.fallback === 'blank'
  const raw = String(query.domain ?? '')
    .replace(/^sc-domain:/, '')
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .trim()
    .toLowerCase()

  function miss() {
    if (!blankOnMiss) {
      setResponseStatus(event, 404)
      return null
    }
    setResponseHeader(event, 'Content-Type', 'image/png')
    setResponseHeader(event, 'Cache-Control', 'public, max-age=604800, s-maxage=2592000, immutable')
    return BLANK_PNG
  }

  if (!raw || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(raw)) {
    if (blankOnMiss)
      return miss()
    throw createError({ statusCode: 400, statusMessage: 'invalid domain' })
  }

  const upstream = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(raw)}&sz=128`

  // A missing favicon is an expected outcome, not an infra failure: plenty of
  // domains have none, and the upstream fetch can also fail on DNS/network. In
  // every such case we want UiFavicon's <img> onerror to fall through to the
  // initials box — so we set a non-2xx status and return empty rather than
  // throwing, which would surface as an unhandled error in Sentry.
  const res = await fetch(upstream).catch((silentCatchError: unknown) => {
    console.warn('[silent-catch] layers/design-system/server/api/favicon.get.ts:30', silentCatchError)
    return null
  })
  if (!res?.ok)
    return miss()

  setResponseHeader(event, 'Content-Type', res.headers.get('content-type') ?? 'image/png')
  // Favicons are effectively immutable per domain; lean on browser + edge cache
  // so the upstream fetch happens at most once per domain per cache lifetime.
  setResponseHeader(event, 'Cache-Control', 'public, max-age=604800, s-maxage=2592000, immutable')
  return new Uint8Array(await res.arrayBuffer())
})
