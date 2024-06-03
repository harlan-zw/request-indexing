import { defineEventHandler } from 'h3'
import { avg, between, inArray, sum } from 'drizzle-orm'
import { authenticateUser } from '~/server/app/utils/auth'
import { userPeriodRange } from '~/server/app/models/User'
import { siteDateAnalytics, teamSites } from '~/server/database/schema'

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

  const range = userPeriodRange(user, {
    includeToday: true,
  })
  const periodSelect = {
    clicks: sum(siteDateAnalytics.clicks),
    impressions: sum(siteDateAnalytics.impressions),
    ctr: avg(siteDateAnalytics.ctr),
    position: avg(siteDateAnalytics.position),
    keywords: avg(siteDateAnalytics.keywords),
  }
  const [period, prevPeriod] = await Promise.all([
    db.select(periodSelect).from(siteDateAnalytics).where(and(
      inArray(siteDateAnalytics.siteId, mySitesQuery.map(s => s.siteId)),
      between(siteDateAnalytics.date, range.period.startDate, range.period.endDate),
    )),
    db.select(periodSelect).from(siteDateAnalytics).where(and(
      inArray(siteDateAnalytics.siteId, mySitesQuery.map(s => s.siteId)),
      between(siteDateAnalytics.date, range.prevPeriod.startDate, range.prevPeriod.endDate),
    )),
  ])
  return { period: period[0], prevPeriod: prevPeriod[0] }
})
