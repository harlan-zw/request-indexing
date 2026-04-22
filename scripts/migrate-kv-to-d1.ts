#!/usr/bin/env bun
import { Buffer } from 'node:buffer'
/**
 * Migrate .data/kv-dump (unstorage dump of the legacy KV store) into the
 * Drizzle/D1 schema defined in server/db/schema.ts.
 *
 * Usage:
 *   NUXT_KEY=<32-char secret> NUXT_OAUTH_POOL='[...]' \
 *     bun scripts/migrate-kv-to-d1.ts [--remote] [--sql-only] [--dry]
 *
 * Flags:
 *   --remote    apply against production D1 (default: local)
 *   --sql-only  emit SQL to .data/migration-sql/ but do not exec wrangler
 *   --dry       parse + emit stats, skip writing SQL
 *
 * Prerequisites:
 *   - `pnpm db:migrate:local` (or :migrate for remote) has been run
 *   - db:seed task inserted google_oauth_clients (or set skipClientCheck)
 */
import { execFileSync } from 'node:child_process'
import { createDecipheriv } from 'node:crypto'
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import process from 'node:process'
import { parse as devalueParse } from 'devalue'

const ROOT = join(import.meta.dirname!, '..')
const KV_DIR = join(ROOT, '.data', 'kv-dump')
const OUT_DIR = join(ROOT, '.data', 'migration-sql')
const DB_NAME = 'request-indexin-bw2z'

const REMOTE = process.argv.includes('--remote')
const SQL_ONLY = process.argv.includes('--sql-only')
const DRY = process.argv.includes('--dry')
const CHUNK_BYTES = 2 * 1024 * 1024 // wrangler d1 execute --file is comfy under ~5MB per call

const NUXT_KEY = process.env.NUXT_KEY
if (!NUXT_KEY || NUXT_KEY.length !== 32) {
  console.error('ERROR: NUXT_KEY must be a 32-char secret (same as production).')
  process.exit(1)
}

interface PoolToken { id: string, client_id: string, client_secret: string, label: string }

const poolRaw = process.env.NUXT_OAUTH_POOL
const poolIdToClientId: Record<string, string> = {}
if (poolRaw) {
  const pool = JSON.parse(poolRaw) as PoolToken[]
  for (const p of pool) poolIdToClientId[p.id] = p.client_id
  console.log(`[oauth-pool] loaded ${pool.length} entries from NUXT_OAUTH_POOL`)
}
else {
  console.warn('[oauth-pool] NUXT_OAUTH_POOL not set — googleAccounts.googleOAuthClientId will fall back to the first seeded client')
}

// ------------------------------------------------------------
// helpers
// ------------------------------------------------------------

function sqlVal(v: unknown): string {
  if (v === null || v === undefined)
    return 'NULL'
  if (typeof v === 'number')
    return Number.isFinite(v) ? String(v) : 'NULL'
  if (typeof v === 'boolean')
    return v ? '1' : '0'
  if (v instanceof Date)
    return String(v.getTime())
  if (typeof v === 'object')
    return `'${JSON.stringify(v).replace(/'/g, '\'\'')}'`
  return `'${String(v).replace(/'/g, '\'\'')}'`
}

function decrypt(payload: string): string {
  const [ivHex, encHex, tagHex] = payload.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const tag = Buffer.from(tagHex, 'hex')
  const decipher = createDecipheriv('aes-256-gcm', NUXT_KEY!, iv)
  decipher.setAuthTag(tag)
  let dec = decipher.update(encHex, 'hex', 'utf8')
  dec += decipher.final('utf8')
  return dec
}

function parseJwt(jwt: string): Record<string, any> {
  const payload = jwt.split('.')[1]
  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
}

async function readJson<T = any>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, 'utf8')) as T
}

async function exists(path: string): Promise<boolean> {
  try { await readFile(path); return true }
  catch { return false }
}

async function listDir(path: string): Promise<string[]> {
  return readdir(path).catch(() => [])
}

// ------------------------------------------------------------
// fetch oauth client map from live DB (for googleOAuthClientId FK)
// ------------------------------------------------------------

function fetchClientIdToPk(): Record<string, number> {
  const args = [
    'd1',
    'execute',
    DB_NAME,
    REMOTE ? '--remote' : '--local',
    '--command',
    'SELECT google_oauth_client_id, client_id FROM google_oauth_clients',
    '--json',
  ]
  const out = execFileSync('wrangler', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  // Wrangler may prepend log lines; extract the trailing JSON payload.
  const jsonStart = out.indexOf('[')
  const json = JSON.parse(out.slice(jsonStart))
  const rows = (Array.isArray(json) ? json[0] : json)?.results ?? []
  const map: Record<string, number> = {}
  for (const r of rows) map[r.client_id] = r.google_oauth_client_id
  return map
}

// ------------------------------------------------------------
// parsers
// ------------------------------------------------------------

interface ParsedUser {
  kvUserId: string // "user-xxxxx"
  email: string
  lastIndexingOAuthId?: string
  loginTokens?: any // google Credentials
  loginJwt?: Record<string, any> // id_token payload (name, picture, email, sub, iat)
  loginSub?: string // Google sub (stable id) from the stored wrapper
  indexingTokens?: any
  loginClientPoolId?: string // derived from reverse pool lookup
  indexingClientPoolId?: string
  sites: ParsedSite[]
  quotaTotal: number
}

interface ParsedSite {
  property: string // "sc-domain:azcleaning.com.au" (or url)
  domain: string | null
  paths: ParsedPath[]
}

interface ParsedPath {
  url: string
  isIndexed: boolean
  verdict: string | null
  firstSeenIndexed: number | null
  lastInspected: number | null
  inspection: any
}

function extractPropertyFromInspection(inspection: any, fallbackUrl: string): { property: string, domain: string | null } {
  const link: string = inspection?.inspectionResultLink ?? ''
  const m = link.match(/resource_id=([^&]+)/)
  if (m) {
    const property = decodeURIComponent(m[1])
    const domain = property.startsWith('sc-domain:') ? property.slice('sc-domain:'.length) : null
    return { property, domain }
  }
  // fallback: use url origin
  try {
    const u = new URL(fallbackUrl)
    return { property: `${u.origin}/`, domain: u.hostname }
  }
  catch {
    return { property: fallbackUrl, domain: null }
  }
}

async function loadUser(kvUserId: string, userDir: string, reversePool: Record<string, string>): Promise<ParsedUser | null> {
  const mePath = join(userDir, 'me.json')
  if (!(await exists(mePath)))
    return null
  const me = await readJson<{ email?: string, indexingOAuthIdNext?: string }>(mePath)
  if (!me?.email)
    return null

  const parsed: ParsedUser = {
    kvUserId,
    email: me.email,
    lastIndexingOAuthId: me.indexingOAuthIdNext,
    sites: [],
    quotaTotal: 0,
  }

  // reverse-lookup which pool this user belonged to for login
  parsed.loginClientPoolId = reversePool[kvUserId]

  const loginPath = join(userDir, 'tokens', 'login.json')
  if (await exists(loginPath)) {
    try {
      const raw = (await readFile(loginPath, 'utf8')).trim()
      // login payload is devalue-encoded { updatedAt, sub, tokens: Credentials }
      const wrapper = devalueParse(decrypt(raw)) as { sub?: string, tokens?: any, access_token?: string }
      const tokens = wrapper?.tokens ?? wrapper // tolerate legacy unwrapped shape
      parsed.loginTokens = tokens
      parsed.loginSub = wrapper?.sub
      if (tokens?.id_token)
        parsed.loginJwt = parseJwt(tokens.id_token)
    }
    catch (err: any) {
      console.warn(`[${kvUserId}] login decrypt failed: ${err.message}`)
    }
  }

  const indexingPath = join(userDir, 'tokens', 'indexing.json')
  if (await exists(indexingPath)) {
    try {
      const raw = (await readFile(indexingPath, 'utf8')).trim()
      // indexing payload is raw Credentials (no wrapper, no id_token)
      const decoded = devalueParse(decrypt(raw)) as any
      parsed.indexingTokens = decoded?.tokens ?? decoded
      parsed.indexingClientPoolId = parsed.lastIndexingOAuthId
    }
    catch (err: any) {
      console.warn(`[${kvUserId}] indexing decrypt failed: ${err.message}`)
    }
  }

  // sites
  const sitesDir = join(userDir, 'sites')
  for (const siteKey of await listDir(sitesDir)) {
    const payloadPath = join(sitesDir, siteKey, 'payload.json')
    if (!(await exists(payloadPath)))
      continue
    try {
      const payload = await readJson<{ urls?: any[] }>(payloadPath)
      if (!payload?.urls?.length)
        continue
      const first = payload.urls.find(u => u?.inspectionResult) ?? payload.urls[0]
      const { property, domain } = extractPropertyFromInspection(first?.inspectionResult, first?.url ?? '')
      const paths: ParsedPath[] = []
      for (const entry of payload.urls) {
        if (!entry?.url)
          continue
        const insp = entry.inspectionResult
        const idx = insp?.indexStatusResult
        const verdict: string | null = idx?.verdict ?? null
        const lastCrawl = idx?.lastCrawlTime ? Date.parse(idx.lastCrawlTime) : null
        const notifyTime = entry.urlNotificationMetadata?.latestUpdate?.notifyTime
        // trim inspection payload — drop noisy fields that blow up SQLite statement size
        const trimmed = insp
          ? {
              inspectionResultLink: insp.inspectionResultLink,
              indexStatusResult: idx
                ? {
                    ...idx,
                    referringUrls: Array.isArray(idx.referringUrls) ? idx.referringUrls.slice(0, 5) : idx.referringUrls,
                    sitemap: Array.isArray(idx.sitemap) ? idx.sitemap.slice(0, 5) : idx.sitemap,
                  }
                : undefined,
              mobileUsabilityResult: insp.mobileUsabilityResult,
            }
          : null
        paths.push({
          url: entry.url,
          isIndexed: verdict === 'PASS',
          verdict,
          firstSeenIndexed: verdict === 'PASS' && notifyTime ? Date.parse(notifyTime) : null,
          lastInspected: entry.lastInspected ?? lastCrawl ?? null,
          inspection: trimmed,
        })
      }
      parsed.sites.push({ property, domain, paths })
    }
    catch (err: any) {
      console.warn(`[${kvUserId}] site ${siteKey} parse failed: ${err.message}`)
    }
  }

  // quota totals (sum across all days, best-effort since no siteId)
  const quotaDir = join(userDir, 'quota')
  const years = await listDir(quotaDir)
  for (const y of years) {
    const months = await listDir(join(quotaDir, y))
    for (const m of months) {
      const days = await listDir(join(quotaDir, y, m))
      for (const d of days) {
        try {
          const q = await readJson<{ indexingApi?: number }>(join(quotaDir, y, m, d))
          parsed.quotaTotal += q?.indexingApi ?? 0
        }
        catch {}
      }
    }
  }

  return parsed
}

// ------------------------------------------------------------
// phase 1: scan pool files to build user -> pool-id map
// ------------------------------------------------------------

async function buildReversePoolMap(): Promise<Record<string, string>> {
  // prefer pool2 (newer); fall back to pool
  const map: Record<string, string> = {}
  for (const dir of ['pool', 'pool2']) {
    const root = join(KV_DIR, 'auth', dir)
    for (const f of await listDir(root)) {
      if (!f.endsWith('.json'))
        continue
      try {
        const entry = await readJson<{ id: string, users: string[] }>(join(root, f))
        for (const u of entry.users ?? []) map[u] = entry.id
      }
      catch {}
    }
  }
  return map
}

// ------------------------------------------------------------
// main
// ------------------------------------------------------------

async function main() {
  console.log(`[target] ${REMOTE ? 'REMOTE' : 'LOCAL'} D1 (${DB_NAME})`)

  // build oauth client id -> PK map
  let clientIdToPk: Record<string, number> = {}
  let fallbackClientPk: number | undefined
  if (!DRY) {
    try {
      clientIdToPk = fetchClientIdToPk()
      console.log(`[oauth-pool] fetched ${Object.keys(clientIdToPk).length} google_oauth_clients rows`)
      fallbackClientPk = Object.values(clientIdToPk)[0]
      if (!fallbackClientPk) {
        console.error('ERROR: google_oauth_clients is empty; run `pnpm db:migrate && db:seed` first.')
        process.exit(1)
      }
    }
    catch (err: any) {
      console.error(`Failed to read google_oauth_clients: ${err.message}`)
      process.exit(1)
    }
  }

  function resolveClientPk(poolId?: string): number {
    if (!poolId)
      return fallbackClientPk!
    const clientId = poolIdToClientId[poolId]
    if (clientId && clientIdToPk[clientId])
      return clientIdToPk[clientId]
    return fallbackClientPk!
  }

  // phase 1: reverse pool
  console.log('[phase 1] scanning auth pools…')
  const reversePool = await buildReversePoolMap()
  console.log(`  ${Object.keys(reversePool).length} user→pool mappings`)

  // phase 2: users
  console.log('[phase 2] loading users…')
  const userRoot = join(KV_DIR, 'user')
  const userDirs = await listDir(userRoot)
  const users: ParsedUser[] = []
  let scanned = 0
  for (const name of userDirs) {
    scanned++
    if (scanned % 250 === 0)
      process.stdout.write(`  ${scanned}/${userDirs.length}\r`)
    const parsed = await loadUser(name, join(userRoot, name), reversePool)
    if (parsed)
      users.push(parsed)
  }
  console.log(`  loaded ${users.length}/${userDirs.length} users`)

  // dedupe users by email (last write wins since order is stable)
  const byEmail = new Map<string, ParsedUser>()
  for (const u of users) byEmail.set(u.email, u)
  const uniqueUsers = [...byEmail.values()]
  if (uniqueUsers.length !== users.length)
    console.log(`  deduped to ${uniqueUsers.length} unique by email (${users.length - uniqueUsers.length} collisions)`)

  // phase 3: global site map (dedup by property)
  console.log('[phase 3] collecting sites…')
  interface SiteRow { siteId: number, property: string, domain: string | null, ownerKvUserId: string }
  const sitesByProperty = new Map<string, SiteRow>()
  let nextSiteId = 1
  for (const u of uniqueUsers) {
    for (const s of u.sites) {
      if (!sitesByProperty.has(s.property)) {
        sitesByProperty.set(s.property, {
          siteId: nextSiteId++,
          property: s.property,
          domain: s.domain,
          ownerKvUserId: u.kvUserId,
        })
      }
    }
  }
  console.log(`  ${sitesByProperty.size} unique sites`)

  // phase 4: assign ids
  const teamIdByKv = new Map<string, number>()
  const userIdByKv = new Map<string, number>()
  let nextTeamId = 1
  let nextUserId = 1
  let nextGoogleAccountId = 1
  for (const u of uniqueUsers) {
    teamIdByKv.set(u.kvUserId, nextTeamId++)
    userIdByKv.set(u.kvUserId, nextUserId++)
  }

  // phase 5: emit SQL
  console.log('[phase 5] emitting SQL…')
  await rm(OUT_DIR, { recursive: true, force: true })
  await mkdir(OUT_DIR, { recursive: true })

  const chunks: string[] = []
  let buf = ''
  let chunkIdx = 0
  async function flush(force = false) {
    if (!buf.length)
      return
    if (!force && buf.length < CHUNK_BYTES)
      return
    const path = join(OUT_DIR, `${String(chunkIdx).padStart(3, '0')}.sql`)
    await writeFile(path, buf)
    chunks.push(path)
    chunkIdx++
    buf = ''
  }
  function push(sql: string) { buf += `${sql}\n` }

  // teams
  push('-- teams')
  for (const u of uniqueUsers) {
    const teamId = teamIdByKv.get(u.kvUserId)!
    push(`INSERT INTO teams (team_id, public_id, personal_team, name, backups_enabled) VALUES (${teamId}, ${sqlVal(u.kvUserId)}, 1, ${sqlVal(u.email)}, 0);`)
    await flush()
  }

  // users
  push('-- users')
  for (const u of uniqueUsers) {
    const userId = userIdByKv.get(u.kvUserId)!
    const teamId = teamIdByKv.get(u.kvUserId)!
    const jwt = u.loginJwt ?? {}
    const name = jwt.name ?? u.email.split('@')[0]
    const avatar = jwt.picture ?? ''
    // prefer wrapper.sub (always present when login decoded) over JWT sub
    const sub = u.loginSub ?? jwt.sub ?? `kv:${u.kvUserId}`
    const lastLogin = jwt.iat ? jwt.iat * 1000 : 0
    push(
      `INSERT INTO users (user_id, public_id, name, email, avatar, last_login, sub, last_indexing_oauth_id, current_team_id)`
      + ` VALUES (${userId}, ${sqlVal(u.kvUserId)}, ${sqlVal(name)}, ${sqlVal(u.email)}, ${sqlVal(avatar)}, ${lastLogin}, ${sqlVal(sub)}, ${sqlVal(u.lastIndexingOAuthId ?? null)}, ${teamId});`,
    )
    push(`INSERT INTO team_user (team_id, user_id, role) VALUES (${teamId}, ${userId}, 'owner');`)
    await flush()
  }

  // google_accounts
  push('-- google_accounts')
  let gaCount = 0
  for (const u of uniqueUsers) {
    const userId = userIdByKv.get(u.kvUserId)!
    if (u.loginTokens) {
      const clientPk = resolveClientPk(u.loginClientPoolId)
      const payload = u.loginJwt ?? { sub: u.loginSub, email: u.email }
      push(
        `INSERT INTO google_accounts (google_account_id, user_id, type, payload, tokens, google_oauth_client_id)`
        + ` VALUES (${nextGoogleAccountId++}, ${userId}, 'login', ${sqlVal(payload)}, ${sqlVal(u.loginTokens)}, ${clientPk});`,
      )
      gaCount++
    }
    if (u.indexingTokens) {
      const clientPk = resolveClientPk(u.indexingClientPoolId ?? u.lastIndexingOAuthId)
      // indexing tokens don't carry a JWT — reuse loginJwt payload (same Google user)
      const payload = u.loginJwt ?? { sub: u.loginSub, email: u.email }
      push(
        `INSERT INTO google_accounts (google_account_id, user_id, type, payload, tokens, google_oauth_client_id)`
        + ` VALUES (${nextGoogleAccountId++}, ${userId}, 'indexing', ${sqlVal(payload)}, ${sqlVal(u.indexingTokens)}, ${clientPk});`,
      )
      gaCount++
    }
    await flush()
  }

  // sites
  push('-- sites')
  for (const s of sitesByProperty.values()) {
    const ownerId = userIdByKv.get(s.ownerKvUserId)!
    push(
      `INSERT INTO sites (site_id, public_id, property, active, domain, owner_id)`
      + ` VALUES (${s.siteId}, ${sqlVal(`kv${s.siteId}`)}, ${sqlVal(s.property)}, 1, ${sqlVal(s.domain)}, ${ownerId});`,
    )
    await flush()
  }

  // user_sites + site_paths (deduped per site)
  push('-- user_sites + site_paths')
  const pathsBySite = new Map<number, Map<string, ParsedPath>>()
  const userSitesSeen = new Set<string>()
  for (const u of uniqueUsers) {
    const userId = userIdByKv.get(u.kvUserId)!
    for (const s of u.sites) {
      const site = sitesByProperty.get(s.property)!
      const key = `${userId}:${site.siteId}`
      if (!userSitesSeen.has(key)) {
        userSitesSeen.add(key)
        push(`INSERT INTO user_sites (user_id, site_id, permission_level) VALUES (${userId}, ${site.siteId}, 'siteOwner');`)
      }
      let bucket = pathsBySite.get(site.siteId)
      if (!bucket) { bucket = new Map(); pathsBySite.set(site.siteId, bucket) }
      for (const p of s.paths) {
        const existing = bucket.get(p.url)
        if (!existing || (p.lastInspected ?? 0) > (existing.lastInspected ?? 0))
          bucket.set(p.url, p)
      }
      await flush()
    }
  }

  let pathCount = 0
  for (const [siteId, bucket] of pathsBySite) {
    for (const p of bucket.values()) {
      pathCount++
      push(
        `INSERT INTO site_paths (site_id, path, first_seen_indexed, is_indexed, indexing_verdict, inspection_payload, last_inspected)`
        + ` VALUES (${siteId}, ${sqlVal(p.url)}, ${sqlVal(p.firstSeenIndexed)}, ${p.isIndexed ? 1 : 0}, ${sqlVal(p.verdict)}, ${sqlVal(p.inspection)}, ${sqlVal(p.lastInspected)});`,
      )
      await flush()
    }
  }

  await flush(true)

  // analytics counters (log only — no schema table)
  console.log('[phase 6] analytics counters (log only):')
  const analyticsDir = join(KV_DIR, 'analytics')
  for (const f of await listDir(analyticsDir)) {
    try {
      const raw = (await readFile(join(analyticsDir, f), 'utf8')).trim()
      console.log(`  ${f.replace('.json', '')} = ${raw}`)
    }
    catch {}
  }

  // summary
  console.log('\n[summary]')
  console.log(`  teams:           ${uniqueUsers.length}`)
  console.log(`  users:           ${uniqueUsers.length}`)
  console.log(`  google_accounts: ${gaCount}`)
  console.log(`  sites:           ${sitesByProperty.size}`)
  console.log(`  site_paths:      ${pathCount}`)
  console.log(`  sql chunks:      ${chunks.length}`)
  const quotaSum = uniqueUsers.reduce((a, u) => a + u.quotaTotal, 0)
  console.log(`  quota total:     ${quotaSum} indexingApi calls (skipped — usages table needs siteId)`)

  if (DRY || SQL_ONLY) {
    console.log(`\n[done] SQL written to ${OUT_DIR}${SQL_ONLY ? ' (apply manually with `wrangler d1 execute --file`)' : ''}`)
    return
  }

  // apply via wrangler
  console.log(`\n[apply] running ${chunks.length} chunks against ${REMOTE ? 'remote' : 'local'} D1…`)
  for (let i = 0; i < chunks.length; i++) {
    process.stdout.write(`  chunk ${i + 1}/${chunks.length}… `)
    try {
      execFileSync('wrangler', [
        'd1',
        'execute',
        DB_NAME,
        REMOTE ? '--remote' : '--local',
        `--file=${chunks[i]}`,
      ], { stdio: ['ignore', 'pipe', 'pipe'] })
      console.log('ok')
    }
    catch (err: any) {
      console.log(`FAIL: ${err.stderr?.toString().slice(0, 400) ?? err.message}`)
      console.error(`aborted at chunk ${i + 1}; fix and resume with a filtered apply.`)
      process.exit(1)
    }
  }

  console.log('\n[done] migration applied.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
