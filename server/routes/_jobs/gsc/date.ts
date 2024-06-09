import { searchconsole } from '@googleapis/searchconsole'
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

  const set = await api.searchanalytics.query({
    siteUrl: site.property,
    requestBody: {
      ...generateDefaultQueryBody(site, {
        start: date,
        end: date,
      }),
    },
  }).then((res) => {
    const row = res.data.rows?.[0] || {}
    return {
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      position: row.position || 0,
    }
  })
  // insert the rows
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
