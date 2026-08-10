import type { H3Event } from 'h3'
import type { ProApiPermission } from '../../shared/permissions/pro-api'
import type { TeamRole } from '../database'
import { and, eq, sql } from 'drizzle-orm'
import { logWarn } from '~~/shared/logging'
import { permissionsForProApiRole, tokenCan } from '../../shared/permissions/pro-api'
import { teamApiTokens, teams, users } from '../database'
import { hashToken, tokenLast4 } from './team-domain'

type ProAuthResult = Awaited<ReturnType<typeof validateProApiKey>>

function getProAuthContext(): ProAuthResult | null {
  let context: Record<string, unknown> | undefined
  try {
    const event = useEvent()
    context = event.context
  }
  catch {
    // H3 context not available (e.g., in Cloudflare MCP handler)
    context = (globalThis as Record<string, unknown>).__mcpEventContext as Record<string, unknown>
  }
  return (context?.proAuth as ProAuthResult) ?? null
}

export function useProAuth(): ProAuthResult {
  const auth = getProAuthContext()
  if (!auth)
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  return auth
}

/**
 * Soft auth variant for MCP tools — returns null instead of throwing.
 * MCP middleware must not throw 401 errors as it triggers OAuth discovery mode.
 */
export function useMcpProAuth(): ProAuthResult | null {
  return getProAuthContext()
}

async function ensureLegacyUserApiKeyImported(
  db: ReturnType<typeof useDrizzle>,
  apiKey: string,
  tokenHash: string,
) {
  const user = await db.select().from(users).where(eq(users.apiKey, apiKey)).get()
  if (!user)
    return null

  const team = user.currentTeamId
    ? await db.select().from(teams).where(eq(teams.teamId, user.currentTeamId)).get()
    : await db.select().from(teams).where(and(eq(teams.ownerId, user.userId), eq(teams.personalTeam, true))).get()

  if (!team)
    return null

  await db.insert(teamApiTokens).values({
    teamId: team.teamId,
    userId: user.userId,
    tokenHash,
    last4: tokenLast4(apiKey),
    label: 'Migrated personal API key',
    role: 'admin',
  }).onConflictDoNothing().catch(err => logWarn('auth.optional_probe_failed', err, { probe: 'legacyApiKeyMigrate', userId: user.userId, teamId: team.teamId }))

  return await db.select().from(teamApiTokens).where(eq(teamApiTokens.tokenHash, tokenHash)).get()
}

export async function validatePlaintextProToken(event: H3Event, apiKey: string) {
  if (!apiKey?.startsWith('nsp_'))
    throw createError({ statusCode: 401, message: 'Invalid API key format' })

  const db = useDrizzle(event)
  const tokenHash = await hashToken(apiKey)
  const tokenRow = await db.select().from(teamApiTokens).where(eq(teamApiTokens.tokenHash, tokenHash)).get()
    ?? await ensureLegacyUserApiKeyImported(db, apiKey, tokenHash)

  if (!tokenRow)
    throw createError({ statusCode: 401, message: 'Invalid API key' })

  if (tokenRow.expiresAt && tokenRow.expiresAt.getTime() < Date.now())
    throw createError({ statusCode: 401, message: 'Token expired' })

  const user = await db.select().from(users).where(eq(users.userId, tokenRow.userId)).get()
  if (!user)
    throw createError({ statusCode: 401, message: 'Token user not found' })

  const blockedStatuses = ['past_due', 'paused', 'canceled', 'read_only', 'archived']
  if (user.subscriptionStatus && blockedStatuses.includes(user.subscriptionStatus))
    throw createError({ statusCode: 403, message: 'No active subscription' })

  // Best-effort usage update. Auth should not fail if bookkeeping does.
  db.update(teamApiTokens)
    .set({
      lastUsedAt: new Date(),
      usageCount: sql`${teamApiTokens.usageCount} + 1`,
    })
    .where(eq(teamApiTokens.teamApiTokenId, tokenRow.teamApiTokenId))
    .run()
    .catch(err => logWarn('kv.best_effort_write_failed', err, { fn: 'apiToken.usageUpdate', tokenId: tokenRow.teamApiTokenId }))

  // core `sites` has no direct teamId; team→site relation lives on `team_sites`.
  // Until pro-gsc / pro-saas resync the team-site join, expose an empty list.
  const teamSites: Awaited<ReturnType<typeof db.select>> = [] as any

  return {
    user,
    sites: teamSites,
    teamId: tokenRow.teamId,
    role: tokenRow.role as TeamRole,
    permissions: permissionsForProApiRole(tokenRow.role as TeamRole),
    tokenSource: 'team-token' as const,
    tokenId: tokenRow.teamApiTokenId,
    tokenCan: (permission: ProApiPermission) => tokenCan({ role: tokenRow.role as TeamRole }, permission),
  }
}

export async function validateProApiKey(event: H3Event) {
  const apiKey = getHeader(event, 'x-api-key') || getHeader(event, 'authorization')?.replace('Bearer ', '')

  if (!apiKey)
    throw createError({ statusCode: 401, message: 'Invalid API key format' })

  return validatePlaintextProToken(event, apiKey)
}
