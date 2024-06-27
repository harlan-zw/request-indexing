import { searchconsole } from '@googleapis/searchconsole'
import {
  siteDateAnalytics,
  sites,
} from '~/server/database/schema'
import { defineJobHandler } from '~/server/plugins/eventServiceProvider'
import { createGoogleOAuthClient, generateDefaultQueryBody } from '~/server/app/services/gsc'
import { incrementUsage } from '~/server/app/services/usage'
import { chunkedBatch } from '#imports'
// import { wsUsers } from '~/server/routes/_ws'

export default defineJobHandler(async (event) => {
  const { siteId, start, end } = await readBody<{ siteId: number, start: string, end: string }>(event)

  const db = useDrizzle()
  const site = await db.query.sites.findFirst({
    with: {
      owner: {
        with: {
          googleAccounts: {
            with: {
              googleOAuthClient: true,
            },
          },
        },
      },
    },
    where: eq(sites.siteId, siteId),
  })

  if (!site || !site.owner || !site.owner.googleAccounts[0]) {
    throw createError({
      statusCode: 404,
      message: 'Site or User not found',
    })
  }

  const api = searchconsole({
    version: 'v1',
    auth: createGoogleOAuthClient(site.owner.googleAccounts[0]),
  })
  await incrementUsage(site.siteId, 'gsc')
  const rows = await api.searchanalytics.query({
    siteUrl: site.property,
    requestBody: {
      ...generateDefaultQueryBody(site, {
        start,
        end,
      }),
      dimensions: ['date'],
    },
  }).then((res) => {
    return (res.data.rows || []).map((row) => {
      const [date] = row.keys as [string]
      return {
        date,
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      }
    })
  })
  const inserts = rows.map((row) => {
    return db.insert(siteDateAnalytics).values({
      siteId,
      ...row,
    }).onConflictDoUpdate({
      // this is the most accurate data
      target: [siteDateAnalytics.siteId, siteDateAnalytics.date],
      set: row,
    })
  })

  await chunkedBatch(inserts)
  return {
    broadcastTo: site.owner.publicId,
    siteId: site.publicId,
    inserts: inserts.length,
    // startDate,
  }
})
