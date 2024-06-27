import { asc, count, desc, gt, isNotNull, like, lt, notLike } from 'drizzle-orm'
import {
  keywords,
  relatedKeywords,
  sites,
} from '~/server/database/schema'
import { getQueryAsyncDataTable } from '~/server/utils/asyncDataTable'

export default defineEventHandler(async (e) => {
  // extract from db
  // TODO auth
  // const user = await authenticateUser(e)
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
  const { filters, offset, q, sort, pageSize } = getQueryAsyncDataTable<`related:${string}` | 'long-tail' | 'improving' | 'declining'>(e)
  // const filterWhere = []
  const _where = []
  if (q.length) {
    _where.push(like(keywords.keyword, `%${q}%`))
  }
  let uniqueKeywords
  if (filters.some(f => f.startsWith('related'))) {
    const relatedFilter = filters.find(f => f.startsWith('related'))!.split(':')[1]
    const keywordId = (await useDrizzle().select({ keywordId: keywords.keywordId })
      .from(keywords)
      .where(eq(keywords.keyword, relatedFilter)))[0]?.keywordId
    if (!keywordId) {
      return { rows: [] }
    }
    // we need to do a subquery on relatedKeywords
    const sqRelatedKeywords = useDrizzle().select({
      relatedKeywordId: relatedKeywords.relatedKeywordId,
    })
      .from(relatedKeywords)
      .where(eq(relatedKeywords.keywordId, keywordId))
      .as('sqRelatedKeywords')
    uniqueKeywords = useDrizzle().select({
      keyword: keywords.keyword,
    })
      .from(keywords)
      .rightJoin(sqRelatedKeywords, eq(keywords.keywordId, sqRelatedKeywords.relatedKeywordId))
      .where(q.length ? like(keywords.keyword, `%${q}%`) : null)
      .as('uniqueKeywords')
    // filterWhere.push(eq(siteKeywordDateAnalytics.keyword, filter.split(':')[1]))
  }
  else {
    // get unique keywords from siteKeywordDateAnalytics where site id matches
    // uniqueKeywords = useDrizzle().select({
    //   keyword: siteKeywordDatePathAnalytics.keyword,
    // })
    //   .from(siteKeywordDatePathAnalytics)
    //   .where(and(
    //     isNotNull(siteKeywordDatePathAnalytics.keyword),
    //     eq(siteKeywordDatePathAnalytics.siteId, site.siteId),
    //     ...(q.length ? [like(siteKeywordDatePathAnalytics.keyword, `%${q}%`)] : []),
    //   ))
    //   .groupBy(siteKeywordDatePathAnalytics.keyword)
    //   .orderBy(desc(count()))
    //   .as('uniqueKeywords')
    const sqRelatedKeywords = useDrizzle().select({
      relatedKeywordId: relatedKeywords.relatedKeywordId,
    })
      .from(relatedKeywords)
      .where(eq(relatedKeywords.siteId, site.siteId))
      .as('sqRelatedKeywords')
    uniqueKeywords = useDrizzle().select({
      keyword: keywords.keyword,
    })
      .from(keywords)
      .rightJoin(sqRelatedKeywords, eq(keywords.keywordId, sqRelatedKeywords.relatedKeywordId))
      .where(q.length ? like(keywords.keyword, `%${q}%`) : null)
      .as('uniqueKeywords')
  }

  const finalWhere = []
  if (filters.includes('long-tail')) {
    // strip branded keywords
    const brandName = site.domain!.split('.')[0].replace('https://', '')
    finalWhere.push(notLike(keywords.keyword, `%${brandName}%`))
    finalWhere.push(
      and(
        gt(keywords.currentMonthSearchVolume, 300),
        lt(keywords.competitionIndex, 30),
      ),
    )
  }

  // select from keywords table where keyword matches unique keywords
  const selectedKeywords = useDrizzle().select({
    keyword: keywords.keyword,
    competition: keywords.competition,
    competitionIndex: keywords.competitionIndex,
    currentMonthSearchVolume: keywords.currentMonthSearchVolume,
    averageCpcMicros: keywords.averageCpcMicros,
    avgMonthlySearches: keywords.avgMonthlySearches,
    lastSynced: keywords.lastSynced,
    monthlySearchVolumes: keywords.monthlySearchVolumes,
  })
    .from(keywords)
    .where(and(
      isNotNull(keywords.keyword),
      ...finalWhere,
    ))
    .rightJoin(uniqueKeywords, eq(keywords.keyword, uniqueKeywords.keyword))
    .groupBy(keywords.keyword)
    .as('selectedKeywords')

  const rows = await useDrizzle().select()
    .from(selectedKeywords)
    .orderBy(sort.column ? (sort.direction === 'asc' ? asc(selectedKeywords[sort.column]) : desc(selectedKeywords[sort.column])) : null)
    .offset(offset)
    .limit(pageSize || 10)

  const totals = await useDrizzle().select({
    count: count().as('total'),
  })
    .from(selectedKeywords)

  return {
    rows,
    total: totals[0].count,
  }
  //
  // const { filter, page, q } = getQuery<{
  //   filter: `path:${string}` | 'first-page' | 'content-gap' | 'new' | 'lost' | 'improving' | 'declining'
  //   page: string
  //   q: string
  // }>(e)
  // const filters = filter.split(',')
  // const filterWhere = []
  // if (filters.includes('first-page')) {
  //   filterWhere.push(lt(siteKeywordDatePathAnalytics.position, 11))
  // }
  // else if (filters.includes('content-gap')) {
  //   // convert above to sql
  //   filterWhere.push(and(
  //     gt(siteKeywordDatePathAnalytics.impressions, 50),
  //     lt(siteKeywordDatePathAnalytics.ctr, 0.005),
  //   ))
  // }
  // const range = userPeriodRange(user, {
  //   includeToday: false,
  // })
  // const _where = [
  //   eq(siteKeywordDatePathAnalytics.siteId, site.siteId),
  //   ...filterWhere,
  // ]
  // if (filter.startsWith('keyword'))
  //   _where.push(eq(siteKeywordDatePathAnalytics.keyword, filter.split(':')[1]))
  // const sq = useDrizzle()
  //   .select({
  //     path: siteKeywordDatePathAnalytics.path,
  //     clicks: sum(siteKeywordDatePathAnalytics.clicks).as('clicks'),
  //     ctr: avg(siteKeywordDatePathAnalytics.ctr).as('ctr'),
  //     impressions: sum(siteKeywordDatePathAnalytics.impressions).as('impressions'),
  //     position: avg(siteKeywordDatePathAnalytics.position).as('position'),
  //   })
  //   .from(siteKeywordDatePathAnalytics)
  //   .where(and(
  //     between(siteKeywordDatePathAnalytics.date, range.period.startDate, range.period.endDate),
  //     ..._where,
  //   ))
  //   .groupBy(siteKeywordDatePathAnalytics.path)
  //   .as('sq')
  //
  // // we're going to get previous period data so we can join it and compute differences
  // const sq2 = useDrizzle()
  //   .select({
  //     path: siteKeywordDatePathAnalytics.path,
  //     prevClicks: sum(siteKeywordDatePathAnalytics.clicks).as('prevClicks'),
  //     ctr: avg(siteKeywordDatePathAnalytics.ctr).as('prevCtr'),
  //     prevImpressions: sum(siteKeywordDatePathAnalytics.impressions).as('prevImpressions'),
  //     position: avg(siteKeywordDatePathAnalytics.position).as('prevPosition'),
  //   })
  //   .from(siteKeywordDatePathAnalytics)
  //   .where(and(
  //     between(siteKeywordDatePathAnalytics.date, range.prevPeriod.startDate, range.prevPeriod.endDate),
  //     ..._where,
  //   ))
  //   .groupBy(siteKeywordDatePathAnalytics.path)
  //   .as('sq2')
  //
  // let finalWhere
  // if (filters.includes('new')) {
  //   finalWhere = and(
  //     gt(sq.clicks, 0),
  //     eq(sq2.prevClicks, 0),
  //   )
  // }
  // else if (filters.includes('lost')) {
  //   finalWhere = and(
  //     eq(sq.clicks, 0),
  //     gt(sq2.prevClicks, 0),
  //   )
  // }
  // else if (filters.includes('improving')) {
  //   finalWhere = gt(sq.clicks, sq2.prevClicks)
  // }
  // else if (filters.includes('declining')) {
  //   finalWhere = gt(sq2.prevClicks, sq.clicks)
  // }
  // const keywordsSelect = useDrizzle().select({
  //   clicks: sq.clicks,
  //   ctr: sq.ctr,
  //   impressions: sq.impressions,
  //   path: sq.path,
  //   position: sq.position,
  //   prevClicks: sq2.prevClicks,
  //   prevCtr: sq2.ctr,
  //   prevImpressions: sq2.prevImpressions,
  //   prevPosition: sq2.position,
  //   // pages: sq3.path,
  // })
  //   .from(sq)
  //   .leftJoin(sq2, eq(sq.path, sq2.path))
  //   .where(finalWhere)
  //   .orderBy(desc(sq.clicks))
  //   .as('keywordsSelect')
  //
  // const offset = ((Number(page) || 1) - 1) * 10
  // // const keywords = await useDrizzle().select()
  // //   .from(keywordsSelect)
  // //   .offset(offset)
  // //   .limit(10)
  //
  // // if (keywords.length) {
  // //   // for each keyword find the top pages
  // //   const pages = await useDrizzle().select({
  // //     clicks: sum(siteKeywordDatePathAnalytics.clicks).as('clicks'),
  // //     keyword: siteKeywordDatePathAnalytics.keyword,
  // //     path: siteKeywordDatePathAnalytics.path,
  // //     position: avg(siteKeywordDatePathAnalytics.position).as('position'),
  // //     ctr: avg(siteKeywordDatePathAnalytics.ctr).as('ctr'),
  // //   })
  // //     .from(siteKeywordDatePathAnalytics)
  // //     .where(and(
  // //       eq(siteKeywordDatePathAnalytics.siteId, site.siteId),
  // //       between(siteKeywordDatePathAnalytics.date, range.period.startDate, range.period.endDate),
  // //       // filter for keywords
  // //       inArray(siteKeywordDatePathAnalytics.keyword, keywords.map(row => row.keyword)),
  // //     ))
  // //     .groupBy(siteKeywordDatePathAnalytics.keyword, siteKeywordDatePathAnalytics.path)
  // //     .orderBy(desc(sum(siteKeywordDatePathAnalytics.clicks)))
  // //
  // //   // apply keywords to pages
  // //   for (const keyword of keywords)
  // //     keyword.pages = pages.filter(row => row.keyword === keyword.keyword)
  // // }
  //
  // const totals = await useDrizzle().select({
  //   count: count().as('total'),
  //   // clicks: sum(keywordsSelect.clicks).as('clicks'),
  // })
  //   .from(keywordsSelect)
  // console.log(totals)
  // return {
  //   rows: keywords,
  //   total: totals[0].count,
  //   // totalClicks: Number(totals[0].clicks),
  // }
})
