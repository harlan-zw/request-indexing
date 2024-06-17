import { searchconsole } from '@googleapis/searchconsole'
import {
  siteDateCountryAnalytics,
  sites,
} from '~/server/database/schema'
import { defineJobHandler } from '~/server/plugins/eventServiceProvider'
import { createGoogleOAuthClient, generateDefaultQueryBody } from '~/server/app/services/gsc'
import { chunkedBatch } from '~/server/utils/drizzle'
import { incrementUsage } from '~/server/app/services/usage'
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
      dimensions: ['date', 'country'],
    },
  }).then(res => (res.data.rows || []).map((row) => {
    const [date, country] = row.keys as [string, string]
    return {
      date,
      country,
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    }
  }))

  const batch = rows.map((set) => {
    return db.insert(siteDateCountryAnalytics).values({
      siteId,
      ...set,
    }).onConflictDoUpdate({
      // this is the most accurate data
      target: [siteDateCountryAnalytics.siteId, siteDateCountryAnalytics.date, siteDateCountryAnalytics.country],
      set,
    })
  })
  await chunkedBatch(batch)

  // TODO save country data
  // const dates = await fetchGSCDates(site.owner.googleAccounts[0], {
  //   period: {
  //     start: dayjs().subtract(501, 'days').toDate(),
  //     end: dayjs().toDate(),
  //   },
  // }, site)

  // const { rows, startDate } = dates
  // insert the rows
  // if (rows?.length) {
  //   // should only be a single record
  //   await db.insert(siteDateAnalytics).values({
  //     siteId,
  //     date,
  //     ...set,
  //   }).onConflictDoUpdate({
  //     // this is the most accurate data
  //     target: [siteDateAnalytics.siteId, siteDateAnalytics.date],
  //     set,
  //   })
  // }

  return {
    broadcastTo: site.owner.publicId,
    siteId: site.publicId,
    // startDate,
  }
})
