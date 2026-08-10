// API-key auth middleware for MCP/CLI hosts.
//
// Reads `Authorization: Bearer <key>` (also accepts `x-api-key`). Looks up
// `users.apiKey` first (personal API key — user-scoped), then
// `team_api_tokens.tokenHash` (team-scoped). On hit, populates
// `event.context.proAuth`; `getCaller` reads that and builds a Caller.
//
// Misses are silent: session-only routes still work. The handler enforces
// auth via `defineProApiHandler({ authMethod: 'apiKey' | 'any' })`.

import type { H3Event } from 'h3'
import type { TeamRole, User } from '../database'
import { and, eq, sql } from 'drizzle-orm'
import { logWarn } from '~~/shared/logging'
import { teamApiTokens, teams, users } from '../database'

function extractBearer(event: H3Event): string | null {
  const auth = getHeader(event, 'authorization')
  if (auth?.startsWith('Bearer '))
    return auth.slice(7).trim() || null
  const xKey = getHeader(event, 'x-api-key')
  return xKey?.trim() || null
}

async function sha256Hex(plaintext: string): Promise<string> {
  const data = new TextEncoder().encode(plaintext)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('')
}

interface ProAuthContext {
  user: User
  teamId: number | null
  tokenId: number | null
  role: TeamRole | 'owner'
  source: 'user-api-key' | 'team-token'
}

async function resolveUserApiKey(db: ReturnType<typeof useDrizzle>, apiKey: string): Promise<ProAuthContext | null> {
  // `users.apiKey` is stored plaintext (column is unique). Lookup direct.
  const user = await db.select().from(users).where(eq(users.apiKey, apiKey)).get()
  if (!user)
    return null

  // Personal team for scoping; falls back to currentTeamId.
  const team = user.currentTeamId
    ? await db.select().from(teams).where(eq(teams.teamId, user.currentTeamId)).get()
    : await db.select().from(teams).where(and(eq(teams.ownerId, user.userId), eq(teams.personalTeam, true))).get()

  return {
    user,
    teamId: team?.teamId ?? null,
    tokenId: null,
    role: 'owner',
    source: 'user-api-key',
  }
}

async function resolveTeamApiToken(db: ReturnType<typeof useDrizzle>, apiKey: string): Promise<ProAuthContext | null> {
  const tokenHash = await sha256Hex(apiKey)
  const tokenRow = await db.select().from(teamApiTokens).where(eq(teamApiTokens.tokenHash, tokenHash)).get()
  if (!tokenRow)
    return null

  if (tokenRow.expiresAt && tokenRow.expiresAt.getTime() < Date.now())
    return null

  const user = await db.select().from(users).where(eq(users.userId, tokenRow.userId)).get()
  if (!user)
    return null

  return {
    user,
    teamId: tokenRow.teamId,
    tokenId: tokenRow.teamApiTokenId,
    role: tokenRow.role as TeamRole,
    source: 'team-token',
  }
}

export default defineEventHandler(async (event) => {
  // Already authenticated this request? Don't override.
  if (event.context.proAuth)
    return

  const apiKey = extractBearer(event)
  if (!apiKey)
    return

  const db = useDrizzle()

  // Personal user API key takes precedence (cheaper, no hash needed).
  const resolved = await resolveUserApiKey(db, apiKey)
    .then(r => r ?? resolveTeamApiToken(db, apiKey))
    .catch((err) => {
      logWarn('auth.api_key_lookup_failed', err, { stage: 'api-key middleware' })
      return null
    })

  if (!resolved)
    return

  event.context.proAuth = resolved

  // Best-effort usage bookkeeping for team tokens. Auth must not fail if this does.
  if (resolved.source === 'team-token' && resolved.tokenId) {
    db.update(teamApiTokens)
      .set({
        lastUsedAt: new Date(),
        usageCount: sql`${teamApiTokens.usageCount} + 1`,
      })
      .where(eq(teamApiTokens.teamApiTokenId, resolved.tokenId))
      .run()
      .catch(err => logWarn('kv.best_effort_write_failed', err, { fn: 'apiToken.usageUpdate', tokenId: resolved.tokenId }))
  }
})
