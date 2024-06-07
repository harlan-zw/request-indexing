import { asc, avg, between, count, sum } from 'drizzle-orm'
import { getQuery } from 'h3'
import { authenticateUser } from '~/server/app/utils/auth'
import {
  siteKeywordDateAnalytics,
  siteKeywordDatePathAnalytics,
  sites,
} from '~/server/database/schema'
import { userPeriodRange } from '~/server/app/models/User'
import { fetchKeywordIdeas } from '~/server/app/services/ads'

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
    filter: `keyword:${string}`
    page: string
    q: string
  }>(e)
  const range = userPeriodRange(user, {
    includeToday: false,
  })
  const _where = [
    eq(siteKeywordDateAnalytics.siteId, site.siteId),
  ]
  if (filter.startsWith('keyword:'))
    _where.push(eq(siteKeywordDateAnalytics.keyword, filter.split(':')[1]))
  const sq = useDrizzle()
    .select({
      date: siteKeywordDateAnalytics.date,
      clicks: sum(siteKeywordDateAnalytics.clicks).as('clicks'),
      ctr: avg(siteKeywordDateAnalytics.ctr).as('ctr'),
      impressions: sum(siteKeywordDateAnalytics.impressions).as('impressions'),
      position: avg(siteKeywordDateAnalytics.position).as('position'),
    })
    .from(siteKeywordDateAnalytics)
    .where(and(
      between(siteKeywordDateAnalytics.date, range.period.startDate, range.period.endDate),
      ..._where,
    ))
    // .groupBy(siteKeywordDateAnalytics.date)
    .as('sq')

  const sq3 = useDrizzle()
    .select({
      date: siteKeywordDatePathAnalytics.date,
      pages: count().as('pages'),
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
    clicks: sq.clicks,
    ctr: sq.ctr,
    impressions: sq.impressions,
    position: sq.position,
    pages: sq3.pages,
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

  const history = {} // await fetchKeywordHistorialData([filter.split(':')[1]])
  const ideas = await fetchKeywordIdeas(filter.split(':')[1], site.siteId)
  return {
    ideas,
    history,
    dates,
    period: dates[dates.length - 1],
    prevPeriod: dates[dates.length - 2],
  }
})
