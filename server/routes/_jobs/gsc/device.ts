import { searchconsole } from '@googleapis/searchconsole'
import type { SiteDateAnalyticsSelect } from '~/server/database/schema'
import {
  siteDateAnalytics,
  sites,
} from '~/server/database/schema'
import { defineJobHandler } from '~/server/plugins/eventServiceProvider'
import { createGoogleOAuthClient, generateDefaultQueryBody } from '~/server/app/services/gsc'
// import { wsUsers } from '~/server/routes/_ws'

export default defineJobHandler(async (event) => {
  const { siteId, date } = await readBody<{ siteId: number, date: string }>(event)

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

  const rows2 = await api.searchanalytics.query({
    siteUrl: site.property,
    requestBody: {
      ...generateDefaultQueryBody(site, {
        start: date,
        end: date,
      }),
      dimensions: ['device'],
    },
  }).then(res => (res.data.rows || []).map((row) => {
    const [device] = row.keys as ['MOBILE' | 'DESKTOP' | 'TABLET']
    return {
      device,
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    }
  }))

  const set: SiteDateAnalyticsSelect = rows2.reduce((acc, row) => {
    const device = row.device.toLowerCase()
    acc[`${device}Clicks`] = (acc[`${device}Clicks`] || 0) + row.clicks
    acc[`${device}Impressions`] = (acc[`${device}Impressions`] || 0) + row.impressions
    // ctr and position need to be averages
    acc[`${device}Ctr`] = (acc[`${device}Ctr`] || 0) + row.ctr
    acc[`${device}Position`] = (acc[`${device}Position`] || 0) + row.position
    return acc
  }, {})

  // should only be a single record
  await db.insert(siteDateAnalytics).values({
    siteId,
    date,
    ...set,
  }).onConflictDoUpdate({
    // this is the most accurate data
    target: [siteDateAnalytics.siteId, siteDateAnalytics.date],
    set,
  })
  return {
    broadcastTo: site.owner.publicId,
    siteId: site.publicId,
    // startDate,
  }
})
