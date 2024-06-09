import { searchconsole } from '@googleapis/searchconsole'
import {
  siteDateCountryAnalytics,
  sites,
} from '~/server/database/schema'
import { defineJobHandler } from '~/server/plugins/eventServiceProvider'
import { createGoogleOAuthClient, generateDefaultQueryBody } from '~/server/app/services/gsc'
import { chunkedBatch } from '~/server/utils/drizzle'
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

  const rows = await api.searchanalytics.query({
    siteUrl: site.property,
    requestBody: {
      ...generateDefaultQueryBody(site, {
        start: date,
        end: date,
      }),
      dimensions: ['country'],
    },
  }).then(res => (res.data.rows || []).map((row) => {
    const [country] = row.keys as [string]
    return {
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
      date,
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
