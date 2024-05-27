import { avg, between, count, desc, inArray, like, sum } from 'drizzle-orm'
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
  const query = getQuery(e)
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
      clicks: sum(sitePathDateAnalytics.clicks).as('clicks'),
      ctr: avg(sitePathDateAnalytics.ctr).as('ctr'),
      // ctrPercent:
      impressions: sum(sitePathDateAnalytics.impressions).as('impressions'),
      path: sitePathDateAnalytics.path,
      // page:
      position: avg(sitePathDateAnalytics.position).as('position'),
      // positionPercent:
      // prevCtr:
      // prevPosition:
    })
    .from(sitePathDateAnalytics)
    .where(and(
      eq(sitePathDateAnalytics.siteId, site.siteId),
      between(sitePathDateAnalytics.date, range.period.startDate, range.period.endDate),
    ))
    .groupBy(sitePathDateAnalytics.path)
    .as('sq')

  // we're going to get previous period data so we can join it and compute differences
  const sq2 = useDrizzle()
    .select({
      clicks: sum(sitePathDateAnalytics.clicks).as('prevClicks'),
      ctr: avg(sitePathDateAnalytics.ctr).as('prevCtr'),
      impressions: sum(sitePathDateAnalytics.impressions).as('prevImpressions'),
      path: sitePathDateAnalytics.path,
      position: avg(sitePathDateAnalytics.position).as('prevPosition'),
    })
    .from(sitePathDateAnalytics)
    .where(and(
      eq(sitePathDateAnalytics.siteId, site.siteId),
      between(sitePathDateAnalytics.date, range.prevPeriod.startDate, range.prevPeriod.endDate),
    ))
    .groupBy(sitePathDateAnalytics.path)
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
  const offset = ((query?.page || 1) - 1) * 10

  const pages = await useDrizzle().select({
    clicks: sq.clicks,
    ctr: sq.ctr,
    impressions: sq.impressions,
    path: sq.path,
    position: sq.position,
    prevClicks: sq2.clicks,
    prevCtr: sq2.ctr,
    prevImpressions: sq2.impressions,
    prevPosition: sq2.position,
    // pages: sq3.path,
  })
    .from(sq)
    .leftJoin(sq2, eq(sq.path, sq2.path))
    // .leftJoin(sq3, eq(sq.keyword, sq3.keyword))
    // .groupBy(sq.keyword)
    .where(like(sq.path, `%${query.q || ''}%`))
    .orderBy(desc(sq.clicks))
    .offset(offset)
    .limit(10)

  if (pages.length) {
    // for each keyword find the top pages
    const keywords = await useDrizzle().select({
      clicks: sum(siteKeywordDatePathAnalytics.clicks).as('clicks'),
      position: avg(siteKeywordDatePathAnalytics.position).as('position'),
      ctr: avg(siteKeywordDatePathAnalytics.ctr).as('ctr'),
      impressions: sum(siteKeywordDatePathAnalytics.impressions).as('impressions'),
      keyword: siteKeywordDatePathAnalytics.keyword,
      path: siteKeywordDatePathAnalytics.path,
    })
      .from(siteKeywordDatePathAnalytics)
      .where(and(
        eq(siteKeywordDatePathAnalytics.siteId, site.siteId),
        between(siteKeywordDatePathAnalytics.date, range.period.startDate, range.period.endDate),
        // filter for keywords
        inArray(siteKeywordDatePathAnalytics.path, pages.map(row => row.path)),
      ))
      .groupBy(siteKeywordDatePathAnalytics.keyword, siteKeywordDatePathAnalytics.path)
      .orderBy(desc(sum(siteKeywordDatePathAnalytics.clicks)))

    // apply keywords to pages
    for (const page of pages)
      page.keywords = keywords.filter(row => row.path === page.path)
  }

  const totalPages = await useDrizzle().select({
    count: count().as('total'),
  })
    .from(sitePathDateAnalytics)
    .where(and(
      like(sitePathDateAnalytics.path, `%${query.q || ''}%`),
      eq(sitePathDateAnalytics.siteId, site.siteId),
      between(sitePathDateAnalytics.date, range.period.startDate, range.period.endDate),
    ))
  return {
    rows: pages,
    total: totalPages[0].count,
  }
})
