export default defineEventHandler(async () => {
  /* // extract from db
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
  const { filters, page, q } = getQueryAsyncDataTable(e)
  const filterWhere = []
  if (filters.includes('first-page')) {
    filterWhere.push(lt(siteKeywordDatePathAnalytics.position, 11))
  }
  else if (filters.includes('content-gap')) {
    // convert above to sql
    filterWhere.push(and(
      gt(siteKeywordDatePathAnalytics.impressions, 50),
      lt(siteKeywordDatePathAnalytics.ctr, 0.005),
    ))
  }
  const range = userPeriodRange(user, {
    includeToday: false,
  })
  const _where = [
    eq(siteKeywordDatePathAnalytics.siteId, site.siteId),
    ...filterWhere,
  ]
  if (filters.some(f => f.startsWith('keyword'))) {
    _where.push(eq(siteKeywordDatePathAnalytics.keyword, filter.split(':')[1]))
  const sq = useDrizzle()
    .select({
      path: siteKeywordDatePathAnalytics.path,
      clicks: sum(siteKeywordDatePathAnalytics.clicks).as('clicks'),
      ctr: avg(siteKeywordDatePathAnalytics.ctr).as('ctr'),
      impressions: sum(siteKeywordDatePathAnalytics.impressions).as('impressions'),
      position: avg(siteKeywordDatePathAnalytics.position).as('position'),
    })
    .from(siteKeywordDatePathAnalytics)
    .where(and(
      between(siteKeywordDatePathAnalytics.date, range.period.startDate, range.period.endDate),
      ..._where,
    ))
    .groupBy(siteKeywordDatePathAnalytics.path)
    .as('sq')

  // we're going to get previous period data so we can join it and compute differences
  const sq2 = useDrizzle()
    .select({
      path: siteKeywordDatePathAnalytics.path,
      prevClicks: sum(siteKeywordDatePathAnalytics.clicks).as('prevClicks'),
      ctr: avg(siteKeywordDatePathAnalytics.ctr).as('prevCtr'),
      prevImpressions: sum(siteKeywordDatePathAnalytics.impressions).as('prevImpressions'),
      position: avg(siteKeywordDatePathAnalytics.position).as('prevPosition'),
    })
    .from(siteKeywordDatePathAnalytics)
    .where(and(
      between(siteKeywordDatePathAnalytics.date, range.prevPeriod.startDate, range.prevPeriod.endDate),
      ..._where,
    ))
    .groupBy(siteKeywordDatePathAnalytics.path)
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
    clicks: sq.clicks,
    ctr: sq.ctr,
    impressions: sq.impressions,
    path: sq.path,
    position: sq.position,
    prevClicks: sq2.prevClicks,
    prevCtr: sq2.ctr,
    prevImpressions: sq2.prevImpressions,
    prevPosition: sq2.position,
    // pages: sq3.path,
  })
    .from(sq)
    .leftJoin(sq2, eq(sq.path, sq2.path))
    .where(finalWhere)
    .orderBy(desc(sq.clicks))
    .as('keywordsSelect')

  const offset = ((Number(page) || 1) - 1) * 10
  const keywords = await useDrizzle().select()
    .from(keywordsSelect)
    .offset(offset)
    .limit(10)

  // if (keywords.length) {
  //   // for each keyword find the top pages
  //   const pages = await useDrizzle().select({
  //     clicks: sum(siteKeywordDatePathAnalytics.clicks).as('clicks'),
  //     keyword: siteKeywordDatePathAnalytics.keyword,
  //     path: siteKeywordDatePathAnalytics.path,
  //     position: avg(siteKeywordDatePathAnalytics.position).as('position'),
  //     ctr: avg(siteKeywordDatePathAnalytics.ctr).as('ctr'),
  //   })
  //     .from(siteKeywordDatePathAnalytics)
  //     .where(and(
  //       eq(siteKeywordDatePathAnalytics.siteId, site.siteId),
  //       between(siteKeywordDatePathAnalytics.date, range.period.startDate, range.period.endDate),
  //       // filter for keywords
  //       inArray(siteKeywordDatePathAnalytics.keyword, keywords.map(row => row.keyword)),
  //     ))
  //     .groupBy(siteKeywordDatePathAnalytics.keyword, siteKeywordDatePathAnalytics.path)
  //     .orderBy(desc(sum(siteKeywordDatePathAnalytics.clicks)))
  //
  //   // apply keywords to pages
  //   for (const keyword of keywords)
  //     keyword.pages = pages.filter(row => row.keyword === keyword.keyword)
  // }

  const totals = await useDrizzle().select({
    count: count().as('total'),
    // clicks: sum(keywordsSelect.clicks).as('clicks'),
  })
    .from(keywordsSelect)
  return {
    rows: keywords,
    total: totals[0].count,
    // totalClicks: Number(totals[0].clicks),
  } */
})
