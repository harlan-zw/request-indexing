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
} from '@gscdump/contracts'
import type { H3Event } from 'h3'
import { logWarn } from '~~/shared/logging'
import { notifications } from '#layers/pro-saas/server/database'
import { createGscdumpPublicV1Client } from './gscdump-origin'

export interface MirrorCtx {
  actorUserId: number
  proTeamId?: number | null
}

// Team CRUD moved fully onto the v1 registry (`partner.teams.*` +
// `partner.sites.team.update`); the legacy partner client dropped every team
// method in the 2.0.6 cutover.
export function useGscdumpTeamsClient(event?: H3Event) {
  const client = createGscdumpPublicV1Client(event)
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
      client.createTeam({ body }).then(response => response.data))
  }

  // v1's rename response is `{ ok, name }` (no `.team`); callers only cared
  // about the create result's `.team.id`, so this shape change is a no-op here.
  function renameTeam(teamId: string, body: { name: string }, ctx: MirrorCtx) {
    return wrap('renameTeam', { teamId, ...body }, ctx, () =>
      client.renameTeam({ params: { teamId }, body }).then(response => response.data))
  }

  function deleteTeam(teamId: string, ctx: MirrorCtx) {
    return wrap('deleteTeam', { teamId }, ctx, () =>
      client.deleteTeam({ params: { teamId } }).then(response => response.data))
  }

  // Reconciliation cron only — not absorbed (caller decides on failure).
  function listMembers(teamId: string) {
    return client.listTeamMembers({ params: { teamId } }).then(response => response.data)
  }

  function addMember(teamId: string, body: AddPartnerTeamMemberParams, ctx: MirrorCtx) {
    return wrap('addMember', { teamId, ...body }, ctx, () =>
      client.addTeamMember({ params: { teamId }, body }).then(response => response.data))
  }

  function updateMemberRole(teamId: string, userId: string, body: { role: AddPartnerTeamMemberParams['role'] }, ctx: MirrorCtx) {
    return wrap('updateMemberRole', { teamId, userId, ...body }, ctx, () =>
      client.updateTeamMemberRole({ params: { teamId, userId }, body }).then(response => response.data))
  }

  function removeMember(teamId: string, userId: string, ctx: MirrorCtx) {
    return wrap('removeMember', { teamId, userId }, ctx, () =>
      client.removeTeamMember({ params: { teamId, userId } }).then(response => response.data))
  }

  // v1 keys the bind on the site alone (`PATCH /sites/{siteId}/team`); the
  // userId parameter is retained for callers/audit payloads only.
  function bindSiteToTeam(userId: string, siteId: string, body: BindPartnerSiteTeamParams, ctx: MirrorCtx) {
    return wrap('bindSiteToTeam', { userId, siteId, ...body }, ctx, () =>
      client.updateSiteTeam({ params: { siteId }, body: { teamId: body.teamId ?? null } }).then(response => response.data))
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
