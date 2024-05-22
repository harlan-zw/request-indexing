import { defineEventHandler } from 'h3'
import { asc, avg, between, max, sum } from 'drizzle-orm'
import { authenticateUser } from '~/server/app/utils/auth'
import { userPeriodRange } from '~/server/app/models/User'
import { siteDateAnalytics } from '~/server/database/schema'
import { requireEventSite } from '~/server/app/services/util'

export default defineEventHandler(async (event) => {
  const user = await authenticateUser(event)
  const { site } = await requireEventSite(event, user)

  const range = userPeriodRange(user, {
    includeToday: true,
  })
  const periodSelect = {
    clicks: sum(siteDateAnalytics.clicks),
    impressions: sum(siteDateAnalytics.impressions),
    ctr: avg(siteDateAnalytics.ctr),
    position: avg(siteDateAnalytics.position),
    keywords: avg(siteDateAnalytics.keywords),
    pages: max(siteDateAnalytics.pages),
    totalPagesCount: max(siteDateAnalytics.totalPagesCount),
    indexedPagesCount: max(siteDateAnalytics.indexedPagesCount),
  }
  const db = useDrizzle()
  const [dates, period, prevPeriod] = await Promise.all([
    db.select({
      // all fields except for timestamps and siteId
      clicks: siteDateAnalytics.clicks,
      impressions: siteDateAnalytics.impressions,
      ctr: siteDateAnalytics.ctr,
      position: siteDateAnalytics.position,
      date: siteDateAnalytics.date,
      keywords: siteDateAnalytics.keywords,
      pages: siteDateAnalytics.pages,
      totalPagesCount: siteDateAnalytics.totalPagesCount,
      indexedPagesCount: siteDateAnalytics.indexedPagesCount,
    }).from(siteDateAnalytics)
      .where(and(
        eq(siteDateAnalytics.siteId, site.siteId),
        between(siteDateAnalytics.date, range.period.startDate, range.period.endDate),
      ))
      .orderBy(asc(siteDateAnalytics.date)),
    db.select(periodSelect).from(siteDateAnalytics).where(and(
      eq(siteDateAnalytics.siteId, site.siteId),
      between(siteDateAnalytics.date, range.period.startDate, range.period.endDate),
    ))
      .orderBy(asc(siteDateAnalytics.date)),
    db.select(periodSelect).from(siteDateAnalytics).where(and(
      eq(siteDateAnalytics.siteId, site.siteId),
      between(siteDateAnalytics.date, range.prevPeriod.startDate, range.prevPeriod.endDate),
    ))
      .orderBy(asc(siteDateAnalytics.date)),
  ])
  return { dates, period: period[0], prevPeriod: prevPeriod[0] }

  // query the db to find the total pages and the pages indexed for each date of the range
  // return useDrizzle().query.siteDateAnalytics.findMany({
  //   where: and(
  //     eq(siteDateAnalytics.siteId, site.siteId),
  //     between(siteDateAnalytics.date, range.period.startDate, range.period.endDate),
  //   ),
  //   orderBy: [asc(siteDateAnalytics.date)],
  // })
})
