import { avg, between, sum } from 'drizzle-orm'
import { authenticateUser } from '~/server/app/utils/auth'
import {
  sitePathDateAnalytics,
  sitePaths,
  sites,
} from '~/server/database/schema'
import { userPeriodRange } from '~/server/app/models/User'

export default defineEventHandler(async (e) => {
  // extract from db
  const user = await authenticateUser(e)
  const { siteId, path } = getRouterParams(e, { decode: true })
  const site = await useDrizzle().query.sites.findFirst({
    where: eq(sites.publicId, siteId),
  })
  if (!site) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Site not found',
    })
  }

  const range = userPeriodRange(user)

  const page = await useDrizzle().query.sitePaths.findFirst({
    where: eq(sitePaths.path, path),
  })

  const stats = await useDrizzle()
    .select({
      path: sitePathDateAnalytics.path,
      // need to use raw sql to get avg of both avg psiDesktopScore and avg psiMobileScore
      psiScore: sql`AVG((${sitePathDateAnalytics.psiDesktopScore} + ${sitePathDateAnalytics.psiMobileScore}) / 2)`.as('psiScore'),
      clicks: sum(sitePathDateAnalytics.clicks).as('clicks'),
      ctr: avg(sitePathDateAnalytics.ctr).as('ctr'),
      impressions: sum(sitePathDateAnalytics.impressions).as('impressions'),
      position: avg(sitePathDateAnalytics.position).as('position'),
    })
    .from(sitePathDateAnalytics)
    .where(and(
      between(sitePathDateAnalytics.date, range.period.startDate, range.period.endDate),
      eq(sitePathDateAnalytics.path, path),
    ))
    .groupBy(sitePathDateAnalytics.path)

  return { page, stats }
})
