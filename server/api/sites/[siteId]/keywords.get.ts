import { asc, avg, between, count, desc, gt, inArray, like, lt, notLike, sum } from 'drizzle-orm'
import { authenticateUser } from '~/server/app/utils/auth'
import {
  keywords,
  siteKeywordDateAnalytics,
  siteKeywordDatePathAnalytics,
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
  const { filters, offset, q, sort, pageSize } = getQueryAsyncDataTable<'first-page' | 'content-gap' | 'new' | 'lost' | 'improving' | 'declining'>(e)
  const filterWhere = []
  if (filters.includes('first-page')) {
    filterWhere.push(lt(siteKeywordDateAnalytics.position, 11))
  }
  else if (filters.includes('content-gap')) {
    // convert above to sql
    filterWhere.push(and(
      gt(siteKeywordDateAnalytics.impressions, 50),
      lt(siteKeywordDateAnalytics.ctr, 0.005),
    ))
  }
  else if (filters.includes('non-branded')) {
    const brandName = site.domain!.split('.')[0].replace('https://', '')
    filterWhere.push(notLike(siteKeywordDateAnalytics.keyword, `%${brandName}%`))
  }
  const range = userPeriodRange(user, {
    includeToday: false,
  })
  const _where = [
    eq(siteKeywordDateAnalytics.siteId, site.siteId),
    ...filterWhere,
  ]
  if (q?.length)
    _where.push(like(siteKeywordDateAnalytics.keyword, `%${q}%`))
  const sq = useDrizzle()
    .select({
      keyword: siteKeywordDateAnalytics.keyword,
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
    .groupBy(siteKeywordDateAnalytics.keyword)
    .as('sq')

  // we're going to get previous period data so we can join it and compute differences
  const sq2 = useDrizzle()
    .select({
      keyword: siteKeywordDateAnalytics.keyword,
      prevClicks: sum(siteKeywordDateAnalytics.clicks).as('prevClicks'),
      ctr: avg(siteKeywordDateAnalytics.ctr).as('prevCtr'),
      prevImpressions: sum(siteKeywordDateAnalytics.impressions).as('prevImpressions'),
      position: avg(siteKeywordDateAnalytics.position).as('prevPosition'),
    })
    .from(siteKeywordDateAnalytics)
    .where(and(
      between(siteKeywordDateAnalytics.date, range.prevPeriod.startDate, range.prevPeriod.endDate),
      ..._where,
    ))
    .groupBy(siteKeywordDateAnalytics.keyword)
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
  const keywordsSelect = useDrizzle().select({
    currentMonthSearchVolume: keywords.currentMonthSearchVolume,
    competitionIndex: keywords.competitionIndex,
    competition: keywords.competition,
    clicks: sq.clicks,
    ctr: sq.ctr,
    impressions: sq.impressions,
    keyword: sq.keyword,
    position: sq.position,
    prevClicks: sq2.prevClicks,
    prevCtr: sq2.ctr,
    prevImpressions: sq2.prevImpressions,
    prevPosition: sq2.position,
    // pages: sq3.path,
  })
    .from(sq)
    .leftJoin(sq2, eq(sq.keyword, sq2.keyword))
    .leftJoin(keywords, eq(keywords.keyword, sq.keyword))
    .where(finalWhere)
    .orderBy(desc(sq.clicks))
    .as('keywordsSelect')

  const _keywords = await useDrizzle().select()
    .from(keywordsSelect)
    .offset(offset)
    .orderBy(sort.column ? (sort.direction === 'asc' ? asc(keywordsSelect[sort.column]) : desc(keywordsSelect[sort.column])) : desc(keywordsSelect.clicks))
    .limit(pageSize)

  if (_keywords.length) {
    // for each keyword find the top pages
    const pages = await useDrizzle().select({
      clicks: sum(siteKeywordDatePathAnalytics.clicks).as('clicks'),
      keyword: siteKeywordDatePathAnalytics.keyword,
      path: siteKeywordDatePathAnalytics.path,
      position: avg(siteKeywordDatePathAnalytics.position).as('position'),
      ctr: avg(siteKeywordDatePathAnalytics.ctr).as('ctr'),
    })
      .from(siteKeywordDatePathAnalytics)
      .where(and(
        eq(siteKeywordDatePathAnalytics.siteId, site.siteId),
        between(siteKeywordDatePathAnalytics.date, range.period.startDate, range.period.endDate),
        // filter for _keywords
        inArray(siteKeywordDatePathAnalytics.keyword, _keywords.map(row => row.keyword)),
      ))
      .groupBy(siteKeywordDatePathAnalytics.keyword, siteKeywordDatePathAnalytics.path)
      .orderBy(desc(sum(siteKeywordDatePathAnalytics.clicks)))

    // apply _keywords to pages
    for (const keyword of _keywords)
      keyword.pages = pages.filter(row => row.keyword === keyword.keyword)
  }

  const totals = await useDrizzle().select({
    count: count().as('total'),
    clicks: sum(keywordsSelect.clicks).as('clicks'),
  })
    .from(keywordsSelect)
  return {
    rows: _keywords.map((row) => {
      row.clicks = Number(row.clicks)
      row.ctr = Number(row.ctr)
      row.impressions = Number(row.impressions)
      row.position = Number(row.position)
      row.prevClicks = Number(row.prevClicks)
      row.prevCtr = Number(row.prevCtr)
      row.prevImpressions = Number(row.prevImpressions)
      row.prevPosition = Number(row.prevPosition)
      return row
    }),
    total: totals[0].count,
    totalClicks: Number(totals[0].clicks),
  }
})
