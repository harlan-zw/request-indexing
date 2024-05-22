import {avg, between, desc, inArray, sum} from 'drizzle-orm'
import { authenticateUser } from '~/server/app/utils/auth'
import {siteKeywordDateAnalytics, siteKeywordDatePathAnalytics, sites} from '~/server/database/schema'
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
  const range = userPeriodRange(user, {
    includeToday: false,
  })
  const sq = useDrizzle()
    .select({
      clicks: sum(siteKeywordDateAnalytics.clicks).as('clicks'),
      ctr: avg(siteKeywordDateAnalytics.ctr).as('ctr'),
      // ctrPercent:
      impressions: sum(siteKeywordDateAnalytics.impressions).as('impressions'),
      keyword: siteKeywordDateAnalytics.keyword,
      // page:
      position: avg(siteKeywordDateAnalytics.position).as('position'),
      // positionPercent:
      // prevCtr:
      // prevPosition:
    })
    .from(siteKeywordDateAnalytics)
    .where(and(
      eq(siteKeywordDateAnalytics.siteId, site.siteId),
      between(siteKeywordDateAnalytics.date, range.period.startDate, range.period.endDate),
    ))
    .groupBy(siteKeywordDateAnalytics.keyword)
    .as('sq')

  // we're going to get previous period data so we can join it and compute differences
  const sq2 = useDrizzle()
    .select({
      clicks: sum(siteKeywordDateAnalytics.clicks).as('prevClicks'),
      ctr: avg(siteKeywordDateAnalytics.ctr).as('prevCtr'),
      impressions: sum(siteKeywordDateAnalytics.impressions).as('prevImpressions'),
      keyword: siteKeywordDateAnalytics.keyword,
      position: avg(siteKeywordDateAnalytics.position).as('prevPosition'),
    })
    .from(siteKeywordDateAnalytics)
    .where(and(
      eq(siteKeywordDateAnalytics.siteId, site.siteId),
      between(siteKeywordDateAnalytics.date, range.prevPeriod.startDate, range.prevPeriod.endDate),
    ))
    .groupBy(siteKeywordDateAnalytics.keyword)
    .as('sq2')

  // we want to get the top pages, we need to join with siteKeywordDatePathAnalytics
  // const sq3 = useDrizzle()
  //   .select({
  //     clicks: sum(siteKeywordDatePathAnalytics.clicks).as('clicks'),
  //     keyword: siteKeywordDatePathAnalytics.keyword,
  //     path: siteKeywordDatePathAnalytics.path,
  //   })
  //   .from(siteKeywordDatePathAnalytics)
  //   .where(and(
  //     eq(siteKeywordDatePathAnalytics.siteId, site.siteId),
  //     between(siteKeywordDatePathAnalytics.date, range.period.startDate, range.period.endDate),
  //   ))
  //   .groupBy(siteKeywordDatePathAnalytics.keyword)
  //   .as('sq3')

  const keywords = await useDrizzle().select({
    clicks: sq.clicks,
    ctr: sq.ctr,
    impressions: sq.impressions,
    keyword: sq.keyword,
    position: sq.position,
    prevClicks: sq2.clicks,
    prevCtr: sq2.ctr,
    prevImpressions: sq2.impressions,
    prevPosition: sq2.position,
    // pages: sq3.path,
  })
    .from(sq)
    .leftJoin(sq2, eq(sq.keyword, sq2.keyword))
    // .leftJoin(sq3, eq(sq.keyword, sq3.keyword))
    // .groupBy(sq.keyword)
    .orderBy(desc(sq.clicks))
    .limit(10)

  // for each keyword find the top pages
  const pages = await useDrizzle().select({
    clicks: sum(siteKeywordDatePathAnalytics.clicks).as('clicks'),
    keyword: siteKeywordDatePathAnalytics.keyword,
    path: siteKeywordDatePathAnalytics.path,
  })
    .from(siteKeywordDatePathAnalytics)
    .where(and(
      eq(siteKeywordDatePathAnalytics.siteId, site.siteId),
      between(siteKeywordDatePathAnalytics.date, range.period.startDate, range.period.endDate),
      // filter for keywords
      inArray(siteKeywordDatePathAnalytics.keyword, keywords.map((row) => row.keyword)),
    ))
    .groupBy(siteKeywordDatePathAnalytics.keyword, siteKeywordDatePathAnalytics.path)
    .orderBy(desc(sum(siteKeywordDatePathAnalytics.clicks)))

    return {
      pages,
      keywords,
    }
})
