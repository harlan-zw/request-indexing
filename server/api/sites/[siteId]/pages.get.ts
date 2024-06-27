import { asc, between, count, desc, gt, ilike, inArray, max, sum } from 'drizzle-orm'
import { authenticateUser } from '~/server/app/utils/auth'
import {
  siteKeywordDatePathAnalytics,
  sitePathDateAnalytics,
  sitePaths,
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
  const { filters, offset, q, sort, pageSize } = getQueryAsyncDataTable<
    'top-level' | 'new' | 'lost' | 'improving' | 'declining' | 'trending'
  >(e)
  const range = userPeriodRange(user)
  const _where = [
    eq(sitePathDateAnalytics.siteId, site.siteId),
  ]
  if (q?.length)
    _where.push(ilike(sitePathDateAnalytics.path, `%${q}%`))
  const sq = useDrizzle()
    .select({
      path: filters.includes('top-level') ? sql`SUBSTR(path, 1, INSTR(SUBSTR(path, 2), '/') + 1)`.as('topLevelPath1') : sitePathDateAnalytics.path,
      count: count().as('count'),
      // need to use raw sql to get avg of both avg psiDesktopScore and avg psiMobileScore
      // psiScore: sql`AVG((${sitePathDateAnalytics.psiDesktopScore} + ${sitePathDateAnalytics.psiMobileScore}) / 2)`.as('psiScore'),
      // clicks: sum(sitePathDateAnalytics.clicks).as('clicks'),
      clicks: sql<number>`sum(${sitePathDateAnalytics.clicks})`.mapWith(Number).as('clicks'),
      ctr: sql<number>`avg(${sitePathDateAnalytics.ctr})`.mapWith(Number).as('ctr'),
      impressions: sql<number>`sum(${sitePathDateAnalytics.impressions})`.mapWith(Number).as('impressions'),
      position: sql<number>`avg(${sitePathDateAnalytics.position})`.mapWith(Number).as('position'),
    })
    .from(sitePathDateAnalytics)
    .where(and(
      between(sitePathDateAnalytics.date, range.period.startDate, range.period.endDate),
      ..._where,
    ))
    .groupBy(filters.includes('top-level') ? sql`topLevelPath1` : sitePathDateAnalytics.path)
    .as('sq')

  // we're going to get previous period data so we can join it and compute differences
  const sq2 = useDrizzle()
    .select({
      path: filters.includes('top-level') ? sql`SUBSTR(path, 1, INSTR(SUBSTR(path, 2), '/') + 1)`.as('topLevelPath2') : sitePathDateAnalytics.path,
      prevClicks: sql<number>`sum(${sitePathDateAnalytics.clicks})`.mapWith(Number).as('prevClicks'),
      prevCtr: sql<number>`avg(${sitePathDateAnalytics.ctr})`.mapWith(Number).as('prevCtr'),
      prevImpressions: sql<number>`sum(${sitePathDateAnalytics.impressions})`.mapWith(Number).as('prevImpressions'),
      prevPosition: sql<number>`avg(${sitePathDateAnalytics.position})`.mapWith(Number).as('prevPosition'),
    })
    .from(sitePathDateAnalytics)
    .where(and(
      between(sitePathDateAnalytics.date, range.prevPeriod.startDate, range.prevPeriod.endDate),
      ..._where,
    ))
    .groupBy(filters.includes('top-level') ? sql`topLevelPath2` : sitePathDateAnalytics.path)
    .as('sq2')

  let finalWhere
  if (filters.includes('new')) {
    finalWhere = and(
      gt(sq.clicks, 0),
      eq(sq2.prevClicks, 0),
    )
  }
  else if (filters.includes('lost')) {
    finalWhere = and(
      eq(sq.clicks, 0),
      gt(sq2.prevClicks, 0),
    )
  }
  else if (filters.includes('improving')) {
    finalWhere = gt(sq.clicks, sq2.prevClicks)
  }
  else if (filters.includes('declining')) {
    finalWhere = gt(sq2.prevClicks, sq.clicks)
  }
  if (filters.includes('with-clicks')) {
    finalWhere = and(
      gt(sq.clicks, 5),
      gt(sq2.prevClicks, 5),
    )
  }

  // const keywordSq = useDrizzle().select({
  //   path: siteKeywordDatePathAnalytics.path,
  //   keyword: siteKeywordDatePathAnalytics.keyword,
  //   // keywordClicks: sum(siteKeywordDatePathAnalytics.clicks).as('keywordClicks'),
  //   // keywordPosition: avg(siteKeywordDatePathAnalytics.position).as('keywordPosition'),
  // })
  //   .from(siteKeywordDatePathAnalytics)
  //   .where(and(
  //     eq(siteKeywordDatePathAnalytics.siteId, site.siteId),
  //     between(siteKeywordDatePathAnalytics.date, range.period.startDate, range.period.endDate),
  //   ))
  //   .groupBy(siteKeywordDatePathAnalytics.path)
  //   .orderBy(desc(max(siteKeywordDatePathAnalytics.clicks)))
  //   .as('keywordSq')

  const pagesSelect = useDrizzle().select({
    path: sitePaths.path,
    isIndexed: sitePaths.isIndexed,
    count: sq.count,
    // keyword: keywordSq.keyword,
    // keywordClicks: keywordSq.keywordClicks,
    // keywordPosition: keywordSq.keywordPosition,
    // psiScore: sq.psiScore,
    clicks: sq.clicks,
    // need to do the sql equivalent of this code ((a - b) / ((a + b) / 2)) * 100
    // we also want to return a 0 if a or b is 0
    // clicksPercent: sql`((sq.clicks - sq2.prevClicks) / ((sq.clicks + sq2.prevClicks) / 2)) * 100`.as('clicksPercent'),
    // clicksPercent: sql`((${sq.clicks} - ${sq2.prevClicks}) / ((${sq.clicks} + ${sq2.prevClicks}) / 2)) * 100`.as('clicksPercent'),
    // clicksPercent: sql`CASE WHEN (${sq.clicks} + ${sq2.prevClicks}) = 0 THEN 0 ELSE ((${sq.clicks} - ${sq2.prevClicks}) / ((${sq.clicks} + ${sq2.prevClicks}) / 2)) * 100 END`.as('clicksPercent'),
    // clicksPercent: sql`CASE WHEN (${sq.clicks} + ${sq2.prevClicks}) = 0 THEN 0 ELSE ((CAST(${sq.clicks} AS REAL) - ${sq2.prevClicks}) / ((CAST(${sq.clicks} AS REAL) + ${sq2.prevClicks}) / 2)) * 100 END`.as('clicksPercent'),
    clicksPercent: sql`CASE WHEN (${sq.clicks} + ${sq2.prevClicks}) = 0 THEN 0 ELSE ROUND(((CAST(${sq.clicks} AS REAL) - ${sq2.prevClicks}) / ((CAST(${sq.clicks} AS REAL) + ${sq2.prevClicks}) / 2)) * 100, 2) END`.as('clicksPercent'),
    ctr: sq.ctr,
    impressions: sq.impressions,
    position: sq.position,
    prevClicks: sq2.prevClicks,
    prevCtr: sq2.prevCtr,
    prevImpressions: sq2.prevImpressions,
    prevPosition: sq2.prevPosition,
    // prevPsiScore: sq2.prevPsiScore,
    // pages: sq3.path,
  })
    .from(sitePaths) // we want to get non-indexed pages as well
    .leftJoin(sq, filters.includes('top-level') ? sql`sq.topLevelPath1 = sq.topLevelPath2` : eq(sitePaths.path, sq.path))
    .leftJoin(sq2, filters.includes('top-level') ? sql`sq.topLevelPath1 = sq2.topLevelPath2` : eq(sitePaths.path, sq2.path))
    // .leftJoin(keywordSq, eq(sitePaths.path, keywordSq.path))
    .where(and(
      eq(sitePaths.siteId, site.siteId),
      finalWhere,
    ))
    .orderBy(desc(sq.clicks))
    .as('pagesSelect')

  const pages = await useDrizzle().select()
    .from(pagesSelect)
    .orderBy(sort.column ? (sort.direction === 'asc' ? asc(pagesSelect[sort.column]) : desc(pagesSelect[sort.column])) : desc(pagesSelect.clicks))
    .offset(offset)
    .limit(pageSize)

  if (pages.length) {
    // for each keyword find the top pages
    const keywords = await useDrizzle().select()
      .from(siteKeywordDatePathAnalytics)
      .where(and(
        eq(siteKeywordDatePathAnalytics.siteId, site.siteId),
        between(siteKeywordDatePathAnalytics.date, range.period.startDate, range.period.endDate),
        // filter for keywords
        inArray(siteKeywordDatePathAnalytics.path, pages.map(row => row.path)),
      ))
      .groupBy(siteKeywordDatePathAnalytics.path)
      .orderBy(desc(max(siteKeywordDatePathAnalytics.clicks)))

    // apply keywords to pages
    for (const page of pages) {
      const entry = keywords.find(row => row.path === page.path)
      if (entry) {
        page.keyword = entry.keyword
        page.keywordPosition = entry.position
      }
    }
  }

  const totals = await useDrizzle().select({
    count: count().as('total'),
    clicks: sum(sq.clicks).as('clicks'),
  })
    .from(pagesSelect)
  return {
    rows: pages,
    total: totals[0].count,
    totalClicks: Number(totals[0].clicks),
  }
})
