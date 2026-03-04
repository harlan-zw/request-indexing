import dayjs from 'dayjs'
import { isNull, lt } from 'drizzle-orm'
import { sites, teamSites } from '~/server/db/schema'
import { batchJobs } from '~/server/utils/event-service'
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
          lt(sites.lastSynced, dayjs().startOf('day').toDate().getTime()),
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
        }, [
          { name: 'sites/sync-sitemap-pages', payload: { siteId: row.siteId } },
          { name: 'crux/history', payload: { siteId: row.siteId, strategy: 'DESKTOP' } },
          { name: 'crux/history', payload: { siteId: row.siteId, strategy: 'PHONE' } },
          { name: 'paths/run-psi', payload: { siteId: row.siteId, path: '/', strategy: 'mobile' }, queue: 'psi' },
          { name: 'paths/run-psi', payload: { siteId: row.siteId, path: '/', strategy: 'desktop' }, queue: 'psi' },
        ]),
      ),
    )
  },
})
