// Edge Worker — observe-only MVP.
//
// What this does:
//   - Receives every request bound for the customer's origin.
//   - Classifies the UA against the AI crawler pattern set.
//   - On match: logs {ts, engine, botName, path, status, country, cf-ray, ua_hash} to D1.
//   - Forwards the request to ORIGIN_URL unchanged, returns the origin response unchanged.
//
// What this does NOT do (deliberately, this turn):
//   - Inject llms.txt, sitemap, JSON-LD, or markdown alternatives.
//   - Pre-render SPAs.
//   - Submit new URLs to Indexing API / IndexNow.
//   - Track LLM citations.
//
// This is the smallest defensible proof of the "60-second CNAME → first crawler
// hit logged" commitment in VISION.md.

import { classifyAiCrawler } from './crawlers'

export interface Env {
  DB: D1Database
  ORIGIN_URL: string
  SITE_ID: string
}

async function uaHash(ua: string): Promise<string> {
  const data = new TextEncoder().encode(ua)
  const digest = await crypto.subtle.digest('SHA-256', data)
  const bytes = new Uint8Array(digest)
  let hex = ''
  for (let i = 0; i < 8; i++)
    hex += bytes[i]!.toString(16).padStart(2, '0')
  return hex
}

async function logCrawlerHit(env: Env, request: Request, response: Response, match: { engine: string, botName: string }) {
  const url = new URL(request.url)
  const cf = (request as Request & { cf?: { country?: string } }).cf
  const ua = request.headers.get('user-agent') ?? ''

  await env.DB.prepare(
    `INSERT INTO crawler_hits
      (site_id, ts, engine, bot_name, path, status, country, cf_ray, ua_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      env.SITE_ID,
      Date.now(),
      match.engine,
      match.botName,
      url.pathname,
      response.status,
      cf?.country ?? null,
      request.headers.get('cf-ray') ?? null,
      await uaHash(ua),
    )
    .run()
}

async function forwardToOrigin(request: Request, env: Env): Promise<Response> {
  const inbound = new URL(request.url)
  const origin = new URL(env.ORIGIN_URL)
  const target = new URL(inbound.pathname + inbound.search, origin)
  // Preserve method, headers, body. Disable Cloudflare's default
  // caching here — caching is a separate concern handled by a later layer.
  return fetch(target.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body,
    redirect: 'manual',
  })
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const ua = request.headers.get('user-agent')
    const match = classifyAiCrawler(ua)

    const response = await forwardToOrigin(request, env)

    if (match) {
      // Log asynchronously so the origin response is never blocked on D1.
      ctx.waitUntil(logCrawlerHit(env, request, response, match).catch((err) => {
        console.error('[edge] crawler hit log failed', err)
      }))
    }

    return response
  },
} satisfies ExportedHandler<Env>
