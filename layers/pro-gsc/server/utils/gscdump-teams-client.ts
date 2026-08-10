// gscdump.com Partner Teams API Client.
//
// Mirrors pro team CRUD into the matching gscdump.com `teams` rows so that
// gscdump's `requireSiteAccess` / team-share R2 path authorizes pro teammates
// natively. Pro stays the source of truth — partner endpoint failures are
// logged to `notifications` (`gscdump-mirror-failed`) and replayed by the
// reconciliation cron, never raised back to the pro mutation handler.
//
// All endpoints validated by partner-key + partner-scope checks on gscdump's
// side (`requirePartnerOwnedUser` / `requirePartnerOwnedTeam`). All `userId`
// values are gscdump publicIds (`u_<token>`), i.e. what pro stores as
// `users.gscdumpUserId`. Internal numeric ids are never crossed.
//
// Plan: `.claude/context/teams-b3-plan.md` "R2 — Pro mirroring".

import type {
  AddPartnerTeamMemberParams,
  BindPartnerSiteTeamParams,
  CreatePartnerTeamParams,
} from '@gscdump/sdk'
import type { H3Event } from 'h3'
import { logWarn } from '~~/shared/logging'
import { notifications } from '#layers/pro-saas/server/database'
import { createGscdumpPartnerClient } from './gscdump-origin'

export interface MirrorCtx {
  actorUserId: number
  proTeamId?: number | null
}

export function useGscdumpTeamsClient(event?: H3Event) {
  const client = createGscdumpPartnerClient(event)
  const db = useDrizzle(event)

  async function logFailure(ctx: MirrorCtx, op: string, payload: unknown, err: any) {
    const status = err?.statusCode || err?.response?.status || err?.status
    const message = err?.data?.message || err?.message || String(err)
    await db.insert(notifications).values({
      userId: ctx.actorUserId,
      kind: 'gscdump-mirror-failed',
      title: `gscdump mirror failed: ${op}`,
      body: message?.slice(0, 500) ?? null,
      payload: { op, payload, httpStatus: status ?? null, teamId: ctx.proTeamId ?? null } as Record<string, unknown>,
    }).catch(insErr => logWarn('notification.insert_failed', insErr, { op: `gscdump-teams-client.${op}`, originalError: message?.slice(0, 200) }))
  }

  function wrap<T>(op: string, payload: unknown, ctx: MirrorCtx, run: () => Promise<T>): Promise<T | null> {
    return run().catch(async (err) => {
      await logFailure(ctx, op, payload, err)
      return null
    })
  }

  function createTeam(body: CreatePartnerTeamParams, ctx: MirrorCtx) {
    return wrap('createTeam', body, ctx, () =>
      client.createTeam(body))
  }

  function renameTeam(teamId: string, body: { name: string }, ctx: MirrorCtx) {
    return wrap('renameTeam', { teamId, ...body }, ctx, () =>
      client.renameTeam(teamId, body))
  }

  function deleteTeam(teamId: string, ctx: MirrorCtx) {
    return wrap('deleteTeam', { teamId }, ctx, () =>
      client.deleteTeam(teamId))
  }

  // Reconciliation cron only — not absorbed (caller decides on failure).
  function listMembers(teamId: string) {
    return client.listTeamMembers(teamId)
  }

  function addMember(teamId: string, body: AddPartnerTeamMemberParams, ctx: MirrorCtx) {
    return wrap('addMember', { teamId, ...body }, ctx, () =>
      client.addTeamMember(teamId, body))
  }

  function updateMemberRole(teamId: string, userId: string, body: { role: AddPartnerTeamMemberParams['role'] }, ctx: MirrorCtx) {
    return wrap('updateMemberRole', { teamId, userId, ...body }, ctx, () =>
      client.updateTeamMemberRole(teamId, userId, body))
  }

  function removeMember(teamId: string, userId: string, ctx: MirrorCtx) {
    return wrap('removeMember', { teamId, userId }, ctx, () =>
      client.removeTeamMember(teamId, userId))
  }

  function bindSiteToTeam(userId: string, siteId: string, body: BindPartnerSiteTeamParams, ctx: MirrorCtx) {
    return wrap('bindSiteToTeam', { userId, siteId, ...body }, ctx, () =>
      client.bindSiteToTeam(userId, siteId, body))
  }

  return {
    createTeam,
    renameTeam,
    deleteTeam,
    listMembers,
    addMember,
    updateMemberRole,
    removeMember,
    bindSiteToTeam,
  }
}
