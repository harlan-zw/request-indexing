// Same-origin proxy for the gscdump v1 HTTP API. The browser client
// (`useGscdump.ts`, `useProGscdump.ts`, the realtime plugin) never holds a
// gscdump API key; it authenticates with the host session and calls this
// route, which resolves the request against a closed operation allowlist
// (`gscdump-v1-browser-proxy.ts`), checks the caller owns or has team access
// to the requested site, then forwards upstream with the caller's own stored
// gscdump credential. The credential never round-trips back to the browser.
import type { HttpV1OperationDefinition } from '@gscdump/contracts/v1/http'
import type { GscdumpV1ProxyOperation } from '../../../../internal/gscdump-v1-browser-proxy'
import process from 'node:process'
import { eq } from 'drizzle-orm'
import { createError, getQuery, getRequestHeader, getRequestURL, getRouterParam, readBody } from 'h3'
import { teamSites } from '~~/layers/core/server/db/schema'
import {
  getGscdumpV1ProxySiteId,
  GSCDUMP_V1_USER_SCOPED_OPERATION_ID,
  resolveGscdumpV1ProxyOperation,
  selectGscdumpV1SiteAccess,
} from '#layers/pro-gsc/server/internal/gscdump-v1-browser-proxy'
import { assertGscdumpBrowserUnsafeMethodOrigin } from '#layers/pro-gsc/server/utils/gscdump-browser-origin'
import { getGscdumpApiUrl } from '#layers/pro-gsc/server/utils/gscdump-origin'
import { sites, users } from '#layers/pro-saas/server/database'
import { defineProApiHandler } from '#layers/pro-saas/server/utils/handler'

function requestIdForUpstream(requestId: string): string {
  return `req_${requestId.replace(/[^\w-]/g, '_')}`
}

function proxyQuery(
  event: Parameters<typeof getRequestURL>[0],
  descriptor: HttpV1OperationDefinition,
): URLSearchParams {
  const raw = getQuery(event)
  const schema = descriptor.request.query
  if (!schema) {
    if (Object.keys(raw).length)
      throw createError({ statusCode: 400, statusMessage: 'invalid_request' })
    return new URLSearchParams()
  }

  const parsed = schema.safeParse(raw)
  if (!parsed.success)
    throw createError({ statusCode: 400, statusMessage: 'invalid_request', data: { issues: parsed.error.issues } })
  if (!parsed.data || typeof parsed.data !== 'object' || Array.isArray(parsed.data))
    throw createError({ statusCode: 400, statusMessage: 'invalid_request' })

  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(parsed.data as Record<string, unknown>)) {
    if (value == null)
      continue
    if (Array.isArray(value)) {
      for (const item of value)
        query.append(key, String(item))
    }
    else {
      query.set(key, String(value))
    }
  }
  return query
}

async function proxyBody(
  event: Parameters<typeof getRequestURL>[0],
  operation: GscdumpV1ProxyOperation,
  descriptor: HttpV1OperationDefinition,
): Promise<string | undefined> {
  if (operation.operation.method === 'GET') {
    const contentLength = getRequestHeader(event, 'content-length')
    const transferEncoding = getRequestHeader(event, 'transfer-encoding')
    if ((contentLength !== undefined && contentLength !== '0') || transferEncoding)
      throw createError({ statusCode: 400, statusMessage: 'invalid_request' })
    return undefined
  }

  const raw = await readBody<unknown>(event)
  // A realtime ticket's origin is host policy, not client input. The browser
  // may send `{}` but cannot choose or smuggle the upstream origin.
  const candidate = operation.operation.id === 'realtime.tickets.create'
    ? (() => {
        if (raw !== undefined && raw !== null
          && (typeof raw !== 'object' || Array.isArray(raw) || Object.keys(raw as object).length > 0)) {
          throw createError({ statusCode: 400, statusMessage: 'invalid_request' })
        }
        return { origin: getRequestURL(event).origin }
      })()
    : raw

  const schema = descriptor.request.body
  if (!schema) {
    if (candidate !== undefined && candidate !== null)
      throw createError({ statusCode: 400, statusMessage: 'invalid_request' })
    return undefined
  }
  const parsed = schema.safeParse(candidate)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'invalid_request',
      data: { issues: parsed.error.issues },
    })
  }
  return JSON.stringify(parsed.data)
}

function sanitizeUpstreamResponse(response: Response): Response {
  const headers = new Headers(response.headers)
  headers.delete('set-cookie')
  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  })
}

export default defineProApiHandler({}, async ({ event, db, caller }) => {
  const surface = getRouterParam(event, 'surface')
  const path = getRouterParam(event, 'path')
  if (!surface || !path)
    throw createError({ statusCode: 404, statusMessage: 'not_found' })

  const operation = resolveGscdumpV1ProxyOperation(event.method.toUpperCase(), surface, path)
  if (!operation)
    throw createError({ statusCode: 404, statusMessage: 'not_found' })
  const descriptor = operation.operation

  const credentialRow = await db.select({
    apiKey: users.gscdumpApiKey,
    userId: users.gscdumpUserId,
  }).from(users).where(eq(users.userId, caller.user.id)).get()

  const upstreamSiteId = getGscdumpV1ProxySiteId(operation)
  let upstreamUserId: string | undefined
  if (upstreamSiteId) {
    const rows = await db.select({
      ownerId: sites.ownerId,
      teamId: teamSites.teamId,
    })
      .from(sites)
      .leftJoin(teamSites, eq(teamSites.siteId, sites.siteId))
      .where(eq(sites.gscdumpSiteId, upstreamSiteId))
      .all()

    const site = rows.length
      ? {
          ownerId: rows[0]!.ownerId,
          teamIds: rows.flatMap(row => row.teamId !== null ? [row.teamId] : []),
        }
      : null

    const access = selectGscdumpV1SiteAccess(caller, site, descriptor.semantics.kind === 'mutation')
    if (access._tag === 'site_not_found')
      throw createError({ statusCode: 404, statusMessage: 'not_found' })
    if (access._tag === 'forbidden')
      throw createError({ statusCode: 403, statusMessage: 'forbidden' })
  }
  else if (descriptor.id === GSCDUMP_V1_USER_SCOPED_OPERATION_ID) {
    // The browser sends an opaque placeholder for `{userId}` (it never learns
    // its own gscdump user id). Substitute the caller's real, stored id when
    // building the upstream path: the placeholder is discarded entirely.
    if (!credentialRow?.userId)
      throw createError({ statusCode: 401, statusMessage: 'gscdump_api_key_missing' })
    upstreamUserId = credentialRow.userId
  }

  const apiKey = credentialRow?.apiKey ?? null
  if (!apiKey)
    throw createError({ statusCode: 401, statusMessage: 'gscdump_api_key_missing' })

  if (descriptor.method !== 'GET')
    assertGscdumpBrowserUnsafeMethodOrigin(event)

  const upstreamPath = upstreamUserId
    ? operation.path.replace(/^users\/[^/]+/, `users/${encodeURIComponent(upstreamUserId)}`)
    : operation.path

  const upstream = new URL(`${getGscdumpApiUrl(event)}/${operation.surface.name}/v1/${upstreamPath}`)
  upstream.search = proxyQuery(event, descriptor).toString()

  const body = await proxyBody(event, operation, descriptor)

  const requestId = String(event.context.requestId ?? crypto.randomUUID())
  const response = await fetch(upstream, {
    method: descriptor.method,
    body,
    headers: {
      // Node-backed Nitro dev fetch decodes gzip/Brotli but retains the
      // upstream Content-Encoding header. Request identity locally so the
      // sanitized Response cannot advertise encoding its body no longer has.
      ...(process.env.NODE_ENV !== 'production' ? { 'accept-encoding': 'identity' } : {}),
      'authorization': `Bearer ${apiKey}`,
      'x-request-id': requestIdForUpstream(requestId),
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
    },
  })

  // Preserve status, body, request id, retry hints, and content type. Never
  // forward an upstream cookie onto the host origin, where a same-name cookie
  // could overwrite the authenticated session.
  return sanitizeUpstreamResponse(response)
})
