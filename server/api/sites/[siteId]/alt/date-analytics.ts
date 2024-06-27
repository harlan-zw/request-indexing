import { defineEventHandler } from 'h3'
import { asc, avg, between, desc, isNotNull, max, sum } from 'drizzle-orm'
import { authenticateUser } from '~/server/app/utils/auth'
import { userPeriodRange } from '~/server/app/models/User'
import { siteDateAnalytics, siteDateCountryAnalytics, sitePathDateAnalytics } from '~/server/database/schema'
import { requireEventSite } from '~/server/app/services/util'
import countries from '~/server/data/countries'

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
  const range = userPeriodRange(user)
  if (user.analyticsPeriod !== 'all') {
    _where.push(between(siteDateAnalytics.date, range.period.startDate, range.period.endDate))
  }

  const periodSelect = {
    clicks: sum(siteDateAnalytics.clicks),
    impressions: sum(siteDateAnalytics.impressions),
    ctr: avg(siteDateAnalytics.ctr),
    position: avg(siteDateAnalytics.position),
    keywords: avg(siteDateAnalytics.keywords),
    pages: max(siteDateAnalytics.pages),
    totalPagesCount: max(siteDateAnalytics.totalPagesCount),
    indexedPagesCount: max(siteDateAnalytics.indexedPagesCount),
    mobileClicks: sum(siteDateAnalytics.mobileClicks),
    desktopClicks: sum(siteDateAnalytics.desktopClicks),
    tabletClicks: sum(siteDateAnalytics.tabletClicks),
    // need to take an average where the value is not null
    // psiDesktopScore: psiSubquery.psiDesktopScore,
    // psiMobileScore: psiSubquery.psiMobileScore,
  }

  const countrySq = useDrizzle()
    .select({
      country: siteDateCountryAnalytics.country,
      clicks: sum(siteDateCountryAnalytics.clicks).mapWith(Number).as('clicks'),
      impressions: sum(siteDateCountryAnalytics.impressions).mapWith(Number).as('impressions'),
    })
    .from(siteDateCountryAnalytics)
    .where(and(
      eq(siteDateCountryAnalytics.siteId, site.siteId),
      between(siteDateCountryAnalytics.date, range.period.startDate, range.period.endDate),
    ))
    .groupBy(siteDateCountryAnalytics.country)
    .as('countrySq')
  const db = useDrizzle()
  const [totalCountData, psiData, topCountries, devices, dates, period, prevPeriod] = await Promise.all([
    db.select({
      clicks: sum(siteDateCountryAnalytics.clicks).mapWith(Number),
      impressions: sum(siteDateCountryAnalytics.impressions).mapWith(Number),
    })
      .from(siteDateCountryAnalytics)
      .where(and(
        eq(siteDateCountryAnalytics.siteId, site.siteId),
        between(siteDateCountryAnalytics.date, range.period.startDate, range.period.endDate),
      )),
    db
      .select({
        psiDesktopPerformance: avg(sitePathDateAnalytics.psiDesktopPerformance),
        psiMobilePerformance: avg(sitePathDateAnalytics.psiMobilePerformance),
        psiMobileBestPractices: avg(sitePathDateAnalytics.psiMobileBestPractices),
        psiMobileSeo: avg(sitePathDateAnalytics.psiMobileSeo),
        psiMobileAccessibility: avg(sitePathDateAnalytics.psiMobileAccessibility),
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
    db.select()
      .from(countrySq)
      .orderBy(desc(countrySq.clicks))
      .limit(5),
    // get device breakdown for clicks
    db.select({
      mobileClicks: sum(siteDateAnalytics.mobileClicks).mapWith(Number),
      desktopClicks: sum(siteDateAnalytics.desktopClicks).mapWith(Number),
      tabletClicks: sum(siteDateAnalytics.tabletClicks).mapWith(Number),
    })
      .from(siteDateAnalytics)
      .where(and(
        eq(siteDateAnalytics.siteId, site.siteId),
        between(siteDateAnalytics.date, range.prevPeriod.startDate, range.prevPeriod.endDate),
      )),
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
      mobileClicks: siteDateAnalytics.mobileClicks,
      desktopClicks: siteDateAnalytics.desktopClicks,
      tabletClicks: siteDateAnalytics.tabletClicks,
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
        .where(and(
          eq(siteDateAnalytics.siteId, site.siteId),
          between(siteDateAnalytics.date, range.prevPeriod.startDate, range.prevPeriod.endDate),
        ))
        .orderBy(asc(siteDateAnalytics.date))
      : Promise.resolve([]),
  ])
  return {
    totalCountData,
    devices: devices[0],
    countries: topCountries.map((row) => {
      const alpha3Code = row.country
      const country = countries.find(c => c['alpha-3'].toLowerCase() === alpha3Code)
      return {
        ...row,
        percent: totalCountData[0].impressions ? (row.impressions / totalCountData[0].impressions * 100) : 0,
        country: country?.name || alpha3Code,
        countryCode: country?.['alpha-2'] || alpha3Code,
      }
    }),
    psiData: psiData[0],
    dates,
    period: period[0],
    prevPeriod: prevPeriod[0],
  }

  // query the db to find the total pages and the pages indexed for each date of the range
  // return useDrizzle().query.siteDateAnalytics.findMany({
  //   where: and(
  //     eq(siteDateAnalytics.siteId, site.siteId),
  //     between(siteDateAnalytics.date, range.period.startDate, range.period.endDate),
  //   ),
  //   orderBy: [asc(siteDateAnalytics.date)],
  // })
})
