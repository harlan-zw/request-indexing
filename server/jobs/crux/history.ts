import { incrementUsage } from '~/server/app/services/usage'
import {
  siteDateAnalytics,
  sitePathDateAnalytics,
  sitePaths,
  sites,
} from '~/server/db/schema'
import { chunkedBatch } from '~/server/utils/drizzle'
import { broadcastToUser } from '~/server/utils/event-service'
import { defineJob } from '../_types'

export default defineJob({
  name: 'crux/history',
  queue: 'psi',
  async handle(payload, ctx) {
    const { siteId, strategy, path } = payload
    const db = ctx.db

    const site = await db.query.sites.findFirst({
      with: {
        owner: {
          with: {
            googleAccounts: {
              with: { googleOAuthClient: true },
            },
          },
        },
        teamSites: {
          with: { googleAccount: true },
        },
      },
      where: eq(sites.siteId, siteId),
    })

    if (!site || !site.owner?.googleAccounts?.[0])
      throw new Error('Site or User not found')

    await incrementUsage(site.siteId, 'crux')
    const rows = await fetchCrux(site.domain!, strategy, path)

    if (!rows?.length) {
      if (site.owner) {
        broadcastToUser(site.owner.publicId, {
          name: 'crux/history',
          entityId: siteId,
          entityType: 'site',
          payload: { siteId: site.publicId, rows: 0 },
        })
      }
      return
    }

    if (!path) {
      // Origin data
      await db.update(sites).set({
        [`has${strategy === 'PHONE' ? 'Mobile' : 'Desktop'}CruxOriginData`]: true,
      }).where(eq(sites.siteId, siteId))

      const inserts = rows.map(set =>
        db.insert(siteDateAnalytics).values({
          date: set.date,
          siteId,
          ...set,
        }).onConflictDoUpdate({
          target: [siteDateAnalytics.siteId, siteDateAnalytics.date],
          set,
        }),
      )
      await chunkedBatch(inserts)
    }
    else {
      // Path data
      await db.update(sitePaths).set({
        [`has${strategy === 'PHONE' ? 'Mobile' : 'Desktop'}CruxOriginData`]: true,
      }).where(and(
        eq(sitePaths.siteId, siteId),
        eq(sitePaths.path, path),
      ))

      const inserts = rows.map(set =>
        db.insert(sitePathDateAnalytics).values({
          date: set.date,
          siteId,
          path,
          ...set,
        }).onConflictDoUpdate({
          target: [sitePathDateAnalytics.siteId, sitePathDateAnalytics.date, sitePathDateAnalytics.path],
          set,
        }),
      )
      await chunkedBatch(inserts)
    }

    // Broadcast
    if (site.owner) {
      broadcastToUser(site.owner.publicId, {
        name: 'crux/history',
        entityId: siteId,
        entityType: 'site',
        payload: { siteId: site.publicId, rows: rows.length },
      })
    }
  },
})
