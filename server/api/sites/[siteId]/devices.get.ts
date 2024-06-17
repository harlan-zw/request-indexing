import { between, count, desc, gt, sum } from 'drizzle-orm'
import { authenticateUser } from '~/server/app/utils/auth'
import {
  siteDateCountryAnalytics,
  sites,
} from '~/server/database/schema'
import { userPeriodRange } from '~/server/app/models/User'
import countries from '~/server/data/countries'

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
  // const { filters, offset, q, sort, pageSize } = getQueryAsyncDataTable<'top-level' | 'new' | 'lost' | 'improving' | 'declining'>(e)
  const range = userPeriodRange(user)
  const _where = [
    eq(siteDateCountryAnalytics.siteId, site.siteId),
    gt(siteDateCountryAnalytics.clicks, 0),
  ]
  // if (q?.length)
  //   _where.push(ilike(sitePathDateAnalytics.path, `%${q}%`))

  const sq = useDrizzle()
    .select({
      country: siteDateCountryAnalytics.country,
      clicks: sum(siteDateCountryAnalytics.clicks).as('clicks'),
    })
    .from(siteDateCountryAnalytics)
    .where(and(
      between(siteDateCountryAnalytics.date, range.period.startDate, range.period.endDate),
      ..._where,
    ))
    .groupBy(siteDateCountryAnalytics.country)
    .as('sq')

  const rows = await useDrizzle().select()
    .from(sq)
    .orderBy(desc(sq.clicks))
    .limit(5)

  const totals = await useDrizzle().select({
    count: count().as('total'),
    clicks: sum(sq.clicks).as('clicks'),
  })
    .from(sq)
  return {
    rows: rows.map((row) => {
      const alpha3Code = row.country
      const country = countries.find(c => c['alpha-3'].toLowerCase() === alpha3Code)
      return {
        ...row,
        percent: (row.clicks / totals[0].clicks) * 100,
        countryCodeGsc: alpha3Code,
        country: country?.name || alpha3Code,
        countryCode: country?.['alpha-2'] || alpha3Code,
      }
    }),
    totals,
  }

  // // we're going to get previous period data so we can join it and compute differences
  // const sq2 = useDrizzle()
  //   .select({
  //     path: filters.includes('top-level') ? sql`SUBSTR(path, 1, INSTR(SUBSTR(path, 2), '/') + 1)`.as('topLevelPath2') : sitePathDateAnalytics.path,
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
  //   .groupBy(filters.includes('top-level') ? sql`topLevelPath2` : sitePathDateAnalytics.path)
  //   .as('sq2')

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

  // const pagesSelect = useDrizzle().select({
  //   path: siteDateCountryAnalytics.path,
  //   isIndexed: sitePaths.isIndexed,
  //   // keyword: keywordSq.keyword,
  //   // keywordClicks: keywordSq.keywordClicks,
  //   // keywordPosition: keywordSq.keywordPosition,
  //   psiScore: sq.psiScore,
  //   clicks: sq.clicks,
  //   ctr: sq.ctr,
  //   impressions: sq.impressions,
  //   position: sq.position,
  //   prevClicks: sq2.prevClicks,
  //   prevCtr: sq2.ctr,
  //   prevImpressions: sq2.prevImpressions,
  //   prevPosition: sq2.position,
  //   prevPsiScore: sq2.prevPsiScore,
  //   // pages: sq3.path,
  // })
  //   .from(siteDateCountryAnalytics) // we want to get non-indexed pages as well
  //   .leftJoin(sq, filters.includes('top-level') ? sql`sq.topLevelPath1 = sq.topLevelPath2` : eq(sitePaths.path, sq.path))
  //   .leftJoin(sq2, filters.includes('top-level') ? sql`sq.topLevelPath1 = sq2.topLevelPath2` : eq(sitePaths.path, sq2.path))
  //   // .leftJoin(keywordSq, eq(sitePaths.path, keywordSq.path))
  //   .where(and(
  //     eq(sitePaths.siteId, site.siteId),
  //     finalWhere,
  //   ))
  //   .orderBy(desc(sq.clicks))
  //   .as('pagesSelect')
  //
  // const pages = await useDrizzle().select()
  //   .from(pagesSelect)
  //   .orderBy(sort.column ? (sort.direction === 'asc' ? asc(pagesSelect[sort.column]) : desc(pagesSelect[sort.column])) : desc(pagesSelect.clicks))
  //   .offset(offset)
  //   .limit(pageSize)
  //
  // if (pages.length) {
  //   // for each keyword find the top pages
  //   const keywords = await useDrizzle().select()
  //     .from(siteKeywordDatePathAnalytics)
  //     .where(and(
  //       eq(siteKeywordDatePathAnalytics.siteId, site.siteId),
  //       between(siteKeywordDatePathAnalytics.date, range.period.startDate, range.period.endDate),
  //       // filter for keywords
  //       inArray(siteKeywordDatePathAnalytics.path, pages.map(row => row.path)),
  //     ))
  //     .groupBy(siteKeywordDatePathAnalytics.path)
  //     .orderBy(desc(max(siteKeywordDatePathAnalytics.clicks)))
  //
  //   // apply keywords to pages
  //   for (const page of pages) {
  //     const entry = keywords.find(row => row.path === page.path)
  //     if (entry) {
  //       page.keyword = entry.keyword
  //       page.keywordPosition = entry.position
  //     }
  //   }
  // }
  //
  // const totals = await useDrizzle().select({
  //   count: count().as('total'),
  //   clicks: sum(sq.clicks).as('clicks'),
  // })
  //   .from(pagesSelect)
  // return {
  //   rows: pages,
  //   total: totals[0].count,
  //   totalClicks: Number(totals[0].clicks),
  // }
})
