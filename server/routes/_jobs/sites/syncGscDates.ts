import dayjs from 'dayjs'

import {
  siteDateAnalytics,
  sites,
} from '~/server/database/schema'
import { defineJobHandler } from '~/server/plugins/eventServiceProvider'
import { chunkedBatch } from '~/server/utils/drizzle'
// import { wsUsers } from '~/server/routes/_ws'

export default defineJobHandler(async (event) => {
  const { siteId } = await readBody<{ siteId: number }>(event)

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

  const dates = await fetchGSCDates(site.owner.googleAccounts[0], {
    period: {
      start: dayjs().subtract(501, 'days').toDate(),
      end: dayjs().toDate(),
    },
  }, site)

  const { rows, startDate } = dates
  // insert the rows
  if (rows.length) {
    await chunkedBatch(rows.map((row) => {
      return db.insert(siteDateAnalytics).values({
        ...row,
        siteId,
      }).onConflictDoNothing()
    }))
  }

  return {
    broadcastTo: site.owner.publicId,
    siteId: site.siteId,
    startDate,
  }
})
