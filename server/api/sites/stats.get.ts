import { defineEventHandler } from 'h3'
import { avg, between, desc, inArray, sum } from 'drizzle-orm'
import { authenticateUser } from '~/server/app/utils/auth'
import { userPeriodRange } from '~/server/app/models/User'
import { siteDateAnalytics, siteDateCountryAnalytics, teamSites } from '~/server/database/schema'

export default defineEventHandler(async (event) => {
  const user = await authenticateUser(event)

  const whereQuery = and(
    eq(teamSites.teamId, user.currentTeamId),
  )
  const db = useDrizzle()
  const mySitesQuery = await db.select({ siteId: teamSites.siteId })
    .from(teamSites)
    .where(whereQuery)

  // team has no sites
  if (!mySitesQuery.length) {
    throw new Error('No sites found')
  }

  const where = []
  const range = userPeriodRange(user)
  if (user.analyticsPeriod !== 'all') {
    where.push(between(siteDateAnalytics.date, range.period.startDate, range.period.endDate))
  }
  const periodSelect = {
    clicks: sum(siteDateAnalytics.clicks),
    impressions: sum(siteDateAnalytics.impressions),
    ctr: avg(siteDateAnalytics.ctr),
    position: avg(siteDateAnalytics.position),
    keywords: avg(siteDateAnalytics.keywords),
    desktop: sum(siteDateAnalytics.desktopClicks),
    mobile: sum(siteDateAnalytics.mobileClicks),
    tablet: sum(siteDateAnalytics.tabletClicks),
  }
  const [period, prevPeriod] = await Promise.all([
    db.select(periodSelect).from(siteDateAnalytics).where(and(
      inArray(siteDateAnalytics.siteId, mySitesQuery.map(s => s.siteId)),
      ...where,
    )),
    user.analyticsPeriod !== 'all'
      ? db.select(periodSelect).from(siteDateAnalytics).where(and(
        inArray(siteDateAnalytics.siteId, mySitesQuery.map(s => s.siteId)),
        between(siteDateAnalytics.date, range.prevPeriod.startDate, range.prevPeriod.endDate),
      ))
      : [],
  ])

  const countryClicks = await db.select({
    country: siteDateCountryAnalytics.country,
    clicks: sum(siteDateCountryAnalytics.clicks),
  })
    .from(siteDateCountryAnalytics)
    .where(and(
      inArray(siteDateCountryAnalytics.siteId, mySitesQuery.map(s => s.siteId)),
    ))
    .groupBy(siteDateCountryAnalytics.country)
    .orderBy(desc(siteDateCountryAnalytics.clicks))
    .limit(3)

  return { period: period[0], prevPeriod: prevPeriod[0], countryClicks }
})
