import { startOfDay } from 'date-fns'
import { and, eq, isNull, lt, or } from 'drizzle-orm'
import { sites, teamSites } from '~~/layers/core/server/db/schema'
import { batchJobs } from '~~/layers/core/server/utils/event-service'
import { defineJob } from '../_types'

export default defineJob({
  name: 'teams/sync-selected',
  queue: 'default',
  async handle(payload, ctx) {
    const { teamId } = payload
    const db = ctx.db

    const teamsSites = await db.select({
      siteId: teamSites.siteId,
    })
      .from(teamSites)
      .where(and(
        eq(teamSites.teamId, teamId),
        or(
          isNull(sites.lastSynced),
          lt(sites.lastSynced, startOfDay(new Date()).getTime()),
        ),
      ))
      .leftJoin(sites, eq(teamSites.siteId, sites.siteId))

    await Promise.all(
      teamsSites.map(row =>
        batchJobs(db, ctx.env, {
          name: 'site/sync',
          siteId: row.siteId,
          onFinish: {
            name: 'sites/sync-finished',
            payload: { siteId: row.siteId },
          },
        }, []),
      ),
    )
  },
})
