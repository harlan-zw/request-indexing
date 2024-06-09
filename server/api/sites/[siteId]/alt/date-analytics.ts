import { defineEventHandler } from 'h3'
import { asc, avg, between, desc, isNotNull, max, sum } from 'drizzle-orm'
import { authenticateUser } from '~/server/app/utils/auth'
import { userPeriodRange } from '~/server/app/models/User'
import { siteDateAnalytics, sitePathDateAnalytics } from '~/server/database/schema'
import { requireEventSite } from '~/server/app/services/util'

export default defineEventHandler(async (event) => {
  const user = await authenticateUser(event)
  const { site } = await requireEventSite(event, user)

  // const query = getQuery(event)
  const _where = [
    eq(siteDateAnalytics.siteId, site.siteId),
  ]
  // if (query.path) {
  //   _where.push(eq(siteDateAnalytics.path, query.path))
  // }
  const range = userPeriodRange(user, {
    includeToday: true,
  })
  if (user.analyticsPeriod !== 'all') {
    _where.push(between(siteDateAnalytics.date, range.period.startDate, range.period.endDate))
  }

  // console.log(psiSubquery)

  const periodSelect = {
    clicks: sum(siteDateAnalytics.clicks),
    impressions: sum(siteDateAnalytics.impressions),
    ctr: avg(siteDateAnalytics.ctr),
    position: avg(siteDateAnalytics.position),
    keywords: avg(siteDateAnalytics.keywords),
    pages: max(siteDateAnalytics.pages),
    totalPagesCount: max(siteDateAnalytics.totalPagesCount),
    indexedPagesCount: max(siteDateAnalytics.indexedPagesCount),
    // need to take an average where the value is not null
    // psiDesktopScore: psiSubquery.psiDesktopScore,
    // psiMobileScore: psiSubquery.psiMobileScore,
  }
  const db = useDrizzle()
  const [psiData, dates, period, prevPeriod] = await Promise.all([
    db
      .select({
        psiDesktopScore: avg(sitePathDateAnalytics.psiDesktopScore),
        psiMobileScore: avg(sitePathDateAnalytics.psiMobileScore),
      })
      .from(sitePathDateAnalytics)
      .where(and(
        eq(sitePathDateAnalytics.siteId, site.siteId),
        ...(user.analyticsPeriod !== 'all'
          ? [
              between(sitePathDateAnalytics.date, range.period.startDate, range.period.endDate),
            ]
          : []),
        isNotNull(sitePathDateAnalytics.psiDesktopScore),
        isNotNull(sitePathDateAnalytics.psiMobileScore),
      ))
      // .groupBy(sitePathDateAnalytics.date)
      .orderBy(desc(sitePathDateAnalytics.date))
      .limit(1),
    db.select({
      // all fields except for timestamps and siteId
      clicks: siteDateAnalytics.clicks,
      impressions: siteDateAnalytics.impressions,
      position: siteDateAnalytics.position,
      ctr: siteDateAnalytics.ctr,
      date: siteDateAnalytics.date,
      keywords: siteDateAnalytics.keywords,
      pages: siteDateAnalytics.pages,
      totalPagesCount: siteDateAnalytics.totalPagesCount,
      indexedPagesCount: siteDateAnalytics.indexedPagesCount,
    }).from(siteDateAnalytics)
      .where(and(..._where))
      .orderBy(asc(siteDateAnalytics.date)),
    db.select(periodSelect)
      .from(siteDateAnalytics)
      .where(and(..._where))
      .orderBy(asc(siteDateAnalytics.date)),
    user.analyticsRange !== 'all'
      ? db.select(periodSelect)
        .from(siteDateAnalytics)
        .where(and(..._where))
        .orderBy(asc(siteDateAnalytics.date))
      : Promise.resolve([]),
  ])
  return { psiData: psiData[0], dates, period: period[0], prevPeriod: prevPeriod[0] }

  // query the db to find the total pages and the pages indexed for each date of the range
  // return useDrizzle().query.siteDateAnalytics.findMany({
  //   where: and(
  //     eq(siteDateAnalytics.siteId, site.siteId),
  //     between(siteDateAnalytics.date, range.period.startDate, range.period.endDate),
  //   ),
  //   orderBy: [asc(siteDateAnalytics.date)],
  // })
})
