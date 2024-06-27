import { avg, between, count, gt, isNotNull } from 'drizzle-orm'
import { authenticateUser } from '~/server/app/utils/auth'
import {
  sitePathDateAnalytics,
  sites,
} from '~/server/database/schema'
import { userPeriodRange } from '~/server/app/models/User'

export default defineEventHandler(async (e) => {
  // extract from db
  const user = await authenticateUser(e)
  const { siteId } = getRouterParams(e, { decode: true })
  const site = await useDrizzle().query.sites.findFirst({
    where: eq(sites.publicId, siteId),
  })
  if (!site) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Site not found',
    })
  }

  const _where = [
    eq(sitePathDateAnalytics.siteId, site.siteId),
    isNotNull(sitePathDateAnalytics.psiMobileScore),
  ]
  const range = userPeriodRange(user)
  return await useDrizzle()
    .select({
      date: sitePathDateAnalytics.date,
      psiDesktopPerformance: avg(sitePathDateAnalytics.psiDesktopPerformance).mapWith(Number).as('psiDesktopPerformance'),
      psiMobilePerformance: avg(sitePathDateAnalytics.psiMobilePerformance).mapWith(Number).as('psiMobilePerformance'),
      psiDesktopSeo: avg(sitePathDateAnalytics.psiDesktopSeo).mapWith(Number).as('psiDesktopSeo'),
      psiMobileSeo: avg(sitePathDateAnalytics.psiMobileSeo).mapWith(Number).as('psiMobileSeo'),
      psiDesktopAccessibility: avg(sitePathDateAnalytics.psiDesktopAccessibility).mapWith(Number).as('psiDesktopAccessibility'),
      psiMobileAccessibility: avg(sitePathDateAnalytics.psiMobileAccessibility).mapWith(Number).as('psiMobileAccessibility'),
      psiDesktopBestPractices: avg(sitePathDateAnalytics.psiDesktopBestPractices).mapWith(Number).as('psiDesktopBestPractices'),
      psiMobileBestPractices: avg(sitePathDateAnalytics.psiMobileBestPractices).mapWith(Number).as('psiMobileBestPractices'),
      psiDesktopScore: avg(sitePathDateAnalytics.psiDesktopScore).mapWith(Number).as('psiDesktopScore'),
      psiMobileScore: avg(sitePathDateAnalytics.psiMobileScore).mapWith(Number).as('psiMobileScore'),
    })
    .from(sitePathDateAnalytics)
    .where(and(
      ..._where,
      between(sitePathDateAnalytics.date, range.period.startDate, range.period.endDate),
    ))
    .groupBy(sitePathDateAnalytics.date)
    .having(gt(count(), 1))
})
