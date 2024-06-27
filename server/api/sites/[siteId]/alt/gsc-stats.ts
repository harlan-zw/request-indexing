import { defineEventHandler } from 'h3'
import { asc, count } from 'drizzle-orm'
import dayjs from 'dayjs'
import { authenticateUser } from '~/server/app/utils/auth'
import { requireEventSite } from '~/server/app/services/util'
import {
  siteDateAnalytics,
  siteKeywordDateAnalytics,
  userSites,
} from '~/server/database/schema'

export default defineEventHandler(async (event) => {
  const user = await authenticateUser(event)
  const { site } = await requireEventSite(event, user)

  // google search console stats, we want to show a number of things:
  // - total % of google search console data ingested
  // - start of gsc data ingestion
  // - total rows

  // need to get the first entry based on date
  const db = useDrizzle()
  const startOfData = await db.select({
    date: siteDateAnalytics.date,
  })
    .from(siteDateAnalytics)
    .where(eq(siteDateAnalytics.siteId, site.siteId))
    .orderBy(asc(siteDateAnalytics.date))

  // get the count of keyword / path rows
  const pathRows = await db.select({
    count: count(),
  })
    .from(siteKeywordDateAnalytics)
    .where(eq(siteKeywordDateAnalytics.siteId, site.siteId))

  const permission = await db.select({
    permissionLevel: userSites.permissionLevel,
  })
    .from(userSites)
    .where(and(
      eq(userSites.siteId, site.siteId),
      eq(userSites.userId, user.userId),
    ))

  const firstDate = dayjs(startOfData[0]?.date)
  const lastDate = dayjs(startOfData[startOfData.length - 1]?.date)
  // we can compute the dates in this and compare to the length of startOfData to see what data we're missing
  const daysDiff = lastDate.diff(firstDate, 'days')
  const missingDates = daysDiff - startOfData.length
  const ingestedPercent = Math.round(startOfData.length / daysDiff * 100)

  return {
    dataSizeEstimate: pathRows[0].count * 300, // 200 bytes per row?
    permissionLevel: permission[0]?.permissionLevel,
    firstDate: firstDate.format('YYYY-MM-DD'),
    lastDate: lastDate.format('YYYY-MM-DD'),
    daysDiff,
    missingDates,
    ingestedPercent,
  }
})
