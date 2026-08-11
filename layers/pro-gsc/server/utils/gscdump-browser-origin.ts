import type { H3Event } from 'h3'
import { createError, getRequestHeader, getRequestURL } from 'h3'

/** Guard session-authenticated browser proxy mutations from credential-backed CSRF. */
export function assertGscdumpBrowserUnsafeMethodOrigin(event: H3Event): void {
  const fetchSite = getRequestHeader(event, 'sec-fetch-site')
  if (fetchSite === 'cross-site')
    throw createError({ statusCode: 403, statusMessage: 'cross_origin_request' })

  const origin = getRequestHeader(event, 'origin')
  if (!origin) {
    // `same-site` is not enough: an untrusted sibling subdomain shares that
    // classification. Without an exact Origin, accept only same-origin or a
    // browser user-initiated request (`none`).
    if (fetchSite !== 'same-origin' && fetchSite !== 'none')
      throw createError({ statusCode: 403, statusMessage: 'cross_origin_request' })
    return
  }

  let exactOrigin: string
  try {
    const parsed = new URL(origin)
    exactOrigin = parsed.origin === origin ? parsed.origin : ''
  }
  catch {
    exactOrigin = ''
  }
  if (!exactOrigin || exactOrigin !== getRequestURL(event).origin)
    throw createError({ statusCode: 403, statusMessage: 'cross_origin_request' })
}
