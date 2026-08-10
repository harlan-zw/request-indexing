import type { H3Event } from 'h3'
import { GSCDUMP_HTTP_V1_VERSION } from '@gscdump/contracts/v1'
import { and, eq, isNull } from 'drizzle-orm'
import { logger } from '~~/shared/server/logger'
import { sites } from '#layers/pro-saas/server/database'
import { dispatchProEvent } from '#layers/pro-saas/server/utils/dispatch'
import { autoLinkGsc } from './auto-link-gsc'
import { useGscdumpClient } from './gscdump-client'
import { updateOnboardingState } from './onboarding'
import { syncUserGscdumpTeams } from './sync-user-gscdump-teams'

export interface ReconcileGscdumpOnboardingOptions {
  event?: H3Event
  userId: number
  gscdumpUserId: string
  currentTeamId?: number | null
  waitForReady?: boolean
}

export interface ReconcileGscdumpOnboardingResult {
  userId: number
  gscdumpUserId: string
  teamId: number | null
  linkedSites: number
  attemptedSites: number
}

export async function reconcileGscdumpOnboardingForUser(opts: ReconcileGscdumpOnboardingOptions): Promise<ReconcileGscdumpOnboardingResult> {
  const { event, userId, gscdumpUserId } = opts
  const db = useDrizzle(event)
  const gscdump = useGscdumpClient()

  const lifecycle = await gscdump.getUserLifecycle(gscdumpUserId)
  if (['refresh_missing', 'scope_missing', 'reauth_required'].includes(lifecycle.account.status)) {
    await updateOnboardingState(userId, {
      gscdumpLifecycle: {
        contractVersion: GSCDUMP_HTTP_V1_VERSION,
        account: lifecycle.account,
        refreshedAt: new Date().toISOString(),
      },
      gscSync: {
        status: 'reconnect_required',
        nextAction: 'reconnect_google',
        reason: lifecycle.account.status,
        refreshedAt: new Date().toISOString(),
      },
    }).catch((e: unknown) => logger.error('[gscdump reconcile] onboarding update failed:', e))
    return {
      userId,
      gscdumpUserId,
      teamId: opts.currentTeamId ?? null,
      linkedSites: 0,
      attemptedSites: 0,
    }
  }

  if (lifecycle.account.status === 'db_provisioning') {
    logger.log('[gscdump reconcile] user database still provisioning:', gscdumpUserId)
    return {
      userId,
      gscdumpUserId,
      teamId: opts.currentTeamId ?? null,
      linkedSites: 0,
      attemptedSites: 0,
    }
  }

  if (opts.waitForReady !== false && lifecycle.account.status !== 'ready')
    await gscdump.waitForUserReady(gscdumpUserId, { attempts: 30, intervalMs: 2000 })

  // GSC + gscdump are ready — flag the connection regardless of whether the
  // user has added a site yet. The only other writer (autoLinkGsc) requires a
  // site row, which left users stuck on `gscConnected: false` after OAuth.
  await updateOnboardingState(userId, {
    setupChecklist: { gscConnected: true },
    gscSync: { status: 'connected', connectedAt: new Date().toISOString() },
  }).catch((e: unknown) => logger.error('[gscdump reconcile] onboarding gscConnected update failed:', e))

  if (event) {
    await dispatchProEvent(event, 'pro:integration:linked', {
      userId,
      kind: 'gscdump',
    }).catch((err: unknown) => logger.error('[pro:integration:linked]', err))
  }

  await syncUserGscdumpTeams(event, { userId, gscdumpUserId })
    .catch((e: unknown) => logger.error('[gscdump reconcile] syncUserGscdumpTeams failed:', e))

  const currentTeamId = opts.currentTeamId ?? null
  if (!currentTeamId) {
    return {
      userId,
      gscdumpUserId,
      teamId: null,
      linkedSites: 0,
      attemptedSites: 0,
    }
  }

  // V1: sites are owner-scoped; team→site lives on team_sites mediator.
  // Until pro-gsc consults that mediator, reconcile against the user's owned sites.
  const unlinkedSites = await db
    .select({ id: sites.siteId, url: sites.property })
    .from(sites)
    .where(and(
      eq(sites.ownerId, userId),
      isNull(sites.gscdumpSiteId),
    ))

  if (!unlinkedSites.length) {
    return {
      userId,
      gscdumpUserId,
      teamId: currentTeamId,
      linkedSites: 0,
      attemptedSites: 0,
    }
  }

  logger.log(`[gscdump reconcile] auto-linking ${unlinkedSites.length} sites to GSC`)

  const available = await gscdump.getAvailableSites(gscdumpUserId).then(r => r.sites).catch((err) => {
    logger.error('[gscdump reconcile] getAvailableSites failed:', err?.data || err?.message || err)
    return null
  })
  if (!available) {
    return {
      userId,
      gscdumpUserId,
      teamId: currentTeamId,
      linkedSites: 0,
      attemptedSites: unlinkedSites.length,
    }
  }

  const results = await Promise.allSettled(
    unlinkedSites.map(site =>
      autoLinkGsc({
        db,
        gscdumpUserId,
        siteId: site.id,
        origin: site.url ?? '',
        availableSites: available,
      }),
    ),
  )

  const linkedSites = results.filter(result => result.status === 'fulfilled' && result.value).length
  logger.log(`[gscdump reconcile] auto-link complete: ${linkedSites}/${unlinkedSites.length}`)

  return {
    userId,
    gscdumpUserId,
    teamId: currentTeamId,
    linkedSites,
    attemptedSites: unlinkedSites.length,
  }
}

export function scheduleGscdumpOnboardingReconcile(event: H3Event, opts: Omit<ReconcileGscdumpOnboardingOptions, 'event'>) {
  const waitUntil = event.context.cloudflare?.context?.waitUntil?.bind(event.context.cloudflare.context)
  const promise = reconcileGscdumpOnboardingForUser({ ...opts, event })
    .catch((e: any) => logger.error('[gscdump reconcile] failed:', e?.data || e?.message || e))

  if (waitUntil)
    waitUntil(promise)
  else
    void promise
}
