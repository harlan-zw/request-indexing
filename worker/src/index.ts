// Edge Worker — Phase A (Observe only).
// Classifies AI crawler UAs, logs to D1 `crawler_hits`, proxies request to origin.
// Inject / Prerender / Submit / Markdown serve are Phases B+C (see .plans/07-edge-worker.md).

export interface Env {
  DB: D1Database
}

// UA token → engine slug. Tokens are matched case-insensitively as substrings
// of the User-Agent header (V1.md line 79).
const UA_ENGINE_MAP: ReadonlyArray<readonly [string, string]> = [
  ['GPTBot', 'gpt'],
  ['ClaudeBot', 'claude'],
  ['PerplexityBot', 'perplexity'],
  ['Google-Extended', 'google-extended'],
  ['CCBot', 'cc'],
  ['Bytespider', 'bytespider'],
  ['Amazonbot', 'amazon'],
  ['anthropic-ai', 'anthropic-ai'],
  ['OAI-SearchBot', 'oai-search'],
  ['Applebot-Extended', 'apple-extended'],
]

function classifyUa(ua: string | null): string | null {
  if (!ua)
    return null
  const lower = ua.toLowerCase()
  for (const [token, engine] of UA_ENGINE_MAP) {
    if (lower.includes(token.toLowerCase()))
      return engine
  }
  return null
}

async function uaHash(ua: string): Promise<string> {
  const bytes = new TextEncoder().encode(ua)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  const hex = Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  return hex.slice(0, 16)
}

async function resolveSiteId(db: D1Database, host: string): Promise<number | null> {
  // sites.property is the GSC URL (e.g. "https://example.com/"); sites.domain is bare host.
  // Match either; prefer domain.
  const lowerHost = host.toLowerCase()
  const row = await db
    .prepare(
      `SELECT site_id FROM sites
       WHERE lower(domain) = ?1
          OR lower(property) = ?2
          OR lower(property) = ?3
          OR lower(property) = ?4
       LIMIT 1`,
    )
    .bind(
      lowerHost,
      `https://${lowerHost}/`,
      `http://${lowerHost}/`,
      `sc-domain:${lowerHost}`,
    )
    .first<{ site_id: number }>()
  return row?.site_id ?? null
}

async function recordHit(
  env: Env,
  args: {
    host: string
    ua: string
    engine: string
    path: string
    status: number | null
    country: string | null
  },
): Promise<void> {
  const siteId = await resolveSiteId(env.DB, args.host)
  if (!siteId)
    return
  const hash = await uaHash(args.ua)
  await env.DB
    .prepare(
      `INSERT INTO crawler_hits
        (site_id, ts, engine, ua, ua_hash, path, status, country)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`,
    )
    .bind(
      siteId,
      Date.now(),
      args.engine,
      args.ua,
      hash,
      args.path,
      args.status,
      args.country,
    )
    .run()
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const ua = request.headers.get('user-agent')
    const engine = classifyUa(ua)

    // Fast-path: not an AI crawler — pass through with zero D1 work.
    if (!engine || !ua)
      return fetch(request)

    const url = new URL(request.url)
    const host = (request.headers.get('host') ?? url.host).toLowerCase()
    const country = request.headers.get('cf-ipcountry')

    // Proxy first so observation never blocks the response.
    const response = await fetch(request)

    ctx.waitUntil(
      recordHit(env, {
        host,
        ua,
        engine,
        path: url.pathname + url.search,
        status: response.status,
        country,
      }).catch(() => {
        // Observe-only: never let logging failure surface to the client.
      }),
    )

    return response
  },
} satisfies ExportedHandler<Env>
