import { searchconsole } from '@googleapis/searchconsole'
import type { SiteDateAnalyticsSelect } from '~/server/database/schema'
import {
  siteDateAnalytics,
  sites,
} from '~/server/database/schema'
import { defineJobHandler } from '~/server/plugins/eventServiceProvider'
import { createGoogleOAuthClient, generateDefaultQueryBody } from '~/server/app/services/gsc'
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

  const rows2 = await api.searchanalytics.query({
    siteUrl: site.property,
    requestBody: {
      ...generateDefaultQueryBody(site, {
        start,
        end,
      }),
      dimensions: ['date', 'device'],
    },
  }).then(res => (res.data.rows || []).map((row) => {
    const [date, device] = row.keys as ['MOBILE' | 'DESKTOP' | 'TABLET']
    return {
      device,
      date,
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    }
  }))

  if (!rows2.length) {
    return {
      broadcastTo: site.owner.publicId,
      siteId: site.publicId,
      // startDate,
    }
  }

  const rows: (SiteDateAnalyticsSelect & { count: number })[] = Object.values(rows2.reduce((acc, row) => {
    const device = row.device.toLowerCase()
    const date = row.date
    if (!acc[date])
      acc[date] = { date, count: 0 }
    acc[date][`${device}Clicks`] = (acc[date][`${device}Clicks`] || 0) + row.clicks
    acc[date][`${device}Impressions`] = (acc[date][`${device}Impressions`] || 0) + row.impressions
    // ctr and position need to be averages
    acc[date][`${device}Ctr`] = (acc[date][`${device}Ctr`] || 0) + row.ctr
    acc[date][`${device}Position`] = (acc[date][`${device}Position`] || 0) + row.position
    acc[date].count++
    return acc
  }, {}))

  const inserts = rows.map((set) => {
    // average ctr and position based on rows2 length
    if (set.mobileCtr)
      set.mobileCtr = set.mobileCtr / set.count
    if (set.desktopCtr)
      set.desktopCtr = set.desktopCtr / set.count
    if (set.mobilePosition)
      set.mobilePosition = set.mobilePosition / set.count
    if (set.desktopPosition)
      set.desktopPosition = set.desktopPosition / set.count
    delete set.count
    return db.insert(siteDateAnalytics).values({
      siteId,
      ...set,
    }).onConflictDoUpdate({
      // this is the most accurate data
      target: [siteDateAnalytics.siteId, siteDateAnalytics.date],
      set,
    })
  })

  await chunkedBatch(inserts)

  return {
    broadcastTo: site.owner.publicId,
    siteId: site.publicId,
    inserts: rows.length,
    // startDate,
  }
})
