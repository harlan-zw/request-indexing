import { asc, avg, between, count, sum } from 'drizzle-orm'
import { getQuery } from 'h3'
import { authenticateUser } from '~/server/app/utils/auth'
import {
  siteKeywordDatePathAnalytics,
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
  const { filter } = getQuery<{
    filter: `path:${string}`
    page: string
    q: string
  }>(e)
  const range = userPeriodRange(user)
  const _where = [
    eq(sitePathDateAnalytics.siteId, site.siteId),
  ]
  if (filter.startsWith('page:'))
    _where.push(eq(sitePathDateAnalytics.path, filter.slice(5)))
  const sq = useDrizzle()
    .select({
      date: sitePathDateAnalytics.date,
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
      ..._where,
    ))
    .groupBy(sitePathDateAnalytics.date)
    .as('sq')

  // we're going to get previous period data so we can join it and compute differences
  // const sq2 = useDrizzle()
  //   .select({
  //     date: sitePathDateAnalytics.date,
  //     prevClicks: sum(sitePathDateAnalytics.clicks).as('prevClicks'),
  //     prevPsiScore: sql`AVG((${sitePathDateAnalytics.psiDesktopScore} + ${sitePathDateAnalytics.psiMobileScore}) / 2)`.as('prevPsiScore'),
  //     ctr: avg(sitePathDateAnalytics.ctr).as('prevCtr'),
  //     prevImpressions: sum(sitePathDateAnalytics.impressions).as('prevImpressions'),
  //     position: avg(sitePathDateAnalytics.position).as('prevPosition'),
  //   })
  //   .from(sitePathDateAnalytics)
  //   .where(and(
  //     between(sitePathDateAnalytics.date, range.prevPeriod.startDate, range.prevPeriod.endDate),
  //     ..._where,
  //   ))
  //   .groupBy(sitePathDateAnalytics.date)
  //   .as('sq2')

  const sq3 = useDrizzle()
    .select({
      date: siteKeywordDatePathAnalytics.date,
      keywords: count().as('keywords'),
    })
    .from(siteKeywordDatePathAnalytics)
    .where(and(
      eq(siteKeywordDatePathAnalytics.siteId, site.siteId),
      eq(siteKeywordDatePathAnalytics.path, filter.slice(5)),
      between(siteKeywordDatePathAnalytics.date, range.period.startDate, range.period.endDate),
    ))
    .groupBy(siteKeywordDatePathAnalytics.date)
    .as('sq3')

  // const offset = ((Number(page) || 1) - 1) * 10

  const dates = await useDrizzle().select({
    psiScore: sq.psiScore,
    clicks: sq.clicks,
    ctr: sq.ctr,
    impressions: sq.impressions,
    position: sq.position,
    keywords: sq3.keywords,
    date: sq.date,
    // prevClicks: sq2.prevClicks,
    // prevCtr: sq2.ctr,
    // prevImpressions: sq2.prevImpressions,
    // prevPosition: sq2.position,
    // prevPsiScore: sq2.prevPsiScore,
    // pages: sq3.path,
  })
    .from(sq)
    .leftJoin(sq3, eq(sq.date, sq3.date))
    .orderBy(asc(sq.date))

  return {
    dates,
    period: dates[dates.length - 1],
    prevPeriod: dates[dates.length - 2],
  }
})
