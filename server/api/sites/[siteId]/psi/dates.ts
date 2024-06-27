import { defineEventHandler } from 'h3'
import { asc, avg, between, isNull, not } from 'drizzle-orm'
import { authenticateUser } from '~/server/app/utils/auth'
import { userPeriodRange } from '~/server/app/models/User'
import { sitePathDateAnalytics } from '~/server/database/schema'
import { requireEventSite } from '~/server/app/services/util'

export default defineEventHandler(async (event) => {
  const user = await authenticateUser(event)
  const { site } = await requireEventSite(event, user)

  // const query = getQuery(event)

  const range = userPeriodRange(user)

  return useDrizzle().select({
    date: sitePathDateAnalytics.date,
    psiDesktopScore: avg(sitePathDateAnalytics.psiDesktopScore),
    psiMobileScore: avg(sitePathDateAnalytics.psiMobileScore),
  }).from(sitePathDateAnalytics).where(and(
    not(isNull(sitePathDateAnalytics.psiDesktopSeo)),
    eq(sitePathDateAnalytics.siteId, site.siteId),
    between(sitePathDateAnalytics.date, range.period.startDate, range.period.endDate),
  ))
    .groupBy(sitePathDateAnalytics.date)
    .orderBy(asc(sitePathDateAnalytics.date))
})
