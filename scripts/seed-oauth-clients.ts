#!/usr/bin/env bun
/**
 * Seed google_oauth_clients from NUXT_OAUTH_POOL env var (pulled from .env.vercel).
 *
 * Usage:
 *   bun scripts/seed-oauth-clients.ts [--remote] [--local]
 *
 * Loads .env.vercel automatically. The `id` field from the pool is used as the
 * stable primary key so migrate-kv-to-d1.ts can reference it.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'

const ROOT = join(import.meta.dirname!, '..')
const DB_NAME = 'request-indexin-bw2z'

const REMOTE = process.argv.includes('--remote')
const LOCAL = process.argv.includes('--local') || !REMOTE

interface PoolToken { id: string, client_id: string, client_secret: string, label: string }

function loadEnvFile(path: string): Record<string, string> {
  const out: Record<string, string> = {}
  const raw = readFileSync(path, 'utf8')
  for (const line of raw.split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (!m)
      continue
    let v = m[2]
    if (v.startsWith('"') && v.endsWith('"'))
      v = v.slice(1, -1)
    out[m[1]] = v
  }
  return out
}

const env = loadEnvFile(join(ROOT, '.env.vercel'))
const poolRaw = env.NUXT_OAUTH_POOL || process.env.NUXT_OAUTH_POOL
if (!poolRaw) {
  console.error('ERROR: NUXT_OAUTH_POOL not found in .env.vercel or environment')
  process.exit(1)
}

const pool = JSON.parse(poolRaw) as PoolToken[]
console.log(`Seeding ${pool.length} OAuth clients to ${REMOTE ? 'REMOTE' : 'LOCAL'} D1...`)

const values = pool.map((p, i) => {
  const label = p.label.replace(/'/g, '\'\'')
  const cid = p.client_id.replace(/'/g, '\'\'')
  const sec = p.client_secret.replace(/'/g, '\'\'')
  return `(${i + 1}, '${label}', '${cid}', '${sec}', 0)`
}).join(',\n  ')

const sql = `INSERT INTO google_oauth_clients (google_oauth_client_id, label, client_id, client_secret, reserved) VALUES\n  ${values}\nON CONFLICT(client_id) DO UPDATE SET\n  label=excluded.label,\n  client_secret=excluded.client_secret;\n`

const sqlPath = join(ROOT, '.data', 'seed-oauth-clients.sql')
writeFileSync(sqlPath, sql)
console.log(`Wrote SQL to ${sqlPath}`)

const flag = REMOTE ? '--remote' : '--local'
execFileSync('wrangler', ['d1', 'execute', DB_NAME, flag, '--file', sqlPath], {
  stdio: 'inherit',
  cwd: ROOT,
})

console.log(`\nVerifying count...`)
execFileSync('wrangler', ['d1', 'execute', DB_NAME, flag, '--command', 'SELECT google_oauth_client_id, label, reserved FROM google_oauth_clients ORDER BY google_oauth_client_id'], {
  stdio: 'inherit',
  cwd: ROOT,
})
