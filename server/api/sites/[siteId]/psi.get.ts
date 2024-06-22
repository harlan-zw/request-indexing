import {asc, avg, between, count, desc, gt, ilike, isNotNull} from 'drizzle-orm'
import { getQuery } from 'h3'
import { authenticateUser } from '~/server/app/utils/auth'
import {
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
  const { filters, offset, q, sort, pageSize } = getQueryAsyncDataTable<
    'top-level' | 'new' | 'lost' | 'improving' | 'declining' | 'trending'
  >(e)

  const _where = [
    eq(sitePathDateAnalytics.siteId, site.siteId),
    isNotNull(sitePathDateAnalytics.psiDesktopPerformance),
    isNotNull(sitePathDateAnalytics.psiMobilePerformance),
  ]
  const range = userPeriodRange(user)

  if (q?.length)
    _where.push(ilike(sitePathDateAnalytics.path, `%${q}%`))
  const sq = useDrizzle()
    .select({
      path: sitePathDateAnalytics.path,
      psiDesktopPerformance: avg(sitePathDateAnalytics.psiDesktopPerformance).as('psiDesktopPerformance'),
      psiMobilePerformance: avg(sitePathDateAnalytics.psiMobilePerformance).as('psiMobilePerformance'),
      psiDesktopSeo: avg(sitePathDateAnalytics.psiDesktopSeo).as('psiDesktopSeo'),
      psiMobileSeo: avg(sitePathDateAnalytics.psiMobileSeo).as('psiMobileSeo'),
      psiDesktopAccessibility: avg(sitePathDateAnalytics.psiDesktopAccessibility).as('psiDesktopAccessibility'),
      psiMobileAccessibility: avg(sitePathDateAnalytics.psiMobileAccessibility).as('psiMobileAccessibility'),
      psiDesktopBestPractices: avg(sitePathDateAnalytics.psiDesktopBestPractices).as('psiDesktopBestPractices'),
      psiMobileBestPractices: avg(sitePathDateAnalytics.psiMobileBestPractices).as('psiMobileBestPractices'),
      psiDesktopScore: avg(sitePathDateAnalytics.psiDesktopScore).as('psiDesktopScore'),
      psiMobileScore: avg(sitePathDateAnalytics.psiMobileScore).as('psiMobileScore'),
    })
    .from(sitePathDateAnalytics)
    .where(and(
      ..._where,
      between(sitePathDateAnalytics.date, range.period.startDate, range.period.endDate),
    ))
    .groupBy(sitePathDateAnalytics.path)
    .as('sq')

  // we're going to get previous period data so we can join it and compute differences
  const sq2 = useDrizzle()
    .select({
      path: sitePathDateAnalytics.path,
      prevPsiDesktopPerformance: avg(sitePathDateAnalytics.psiDesktopPerformance).as('prevPsiDesktopPerformance'),
      prevPsiMobilePerformance: avg(sitePathDateAnalytics.psiMobilePerformance).as('prevPsiMobilePerformance'),
      prevPsiDesktopSeo: avg(sitePathDateAnalytics.psiDesktopSeo).as('prevPsiDesktopSeo'),
      prevPsiMobileSeo: avg(sitePathDateAnalytics.psiMobileSeo).as('prevPsiMobileSeo'),
      prevPsiDesktopAccessibility: avg(sitePathDateAnalytics.psiDesktopAccessibility).as('prevPsiDesktopAccessibility'),
      prevPsiMobileAccessibility: avg(sitePathDateAnalytics.psiMobileAccessibility).as('prevPsiMobileAccessibility'),
      prevPsiDesktopBestPractices: avg(sitePathDateAnalytics.psiDesktopBestPractices).as('prevPsiDesktopBestPractices'),
      prevPsiMobileBestPractices: avg(sitePathDateAnalytics.psiMobileBestPractices).as('prevPsiMobileBestPractices'),
      prevPsiDesktopScore: avg(sitePathDateAnalytics.psiDesktopScore).as('prevPsiDesktopScore'),
      prevPsiMobileScore: avg(sitePathDateAnalytics.psiMobileScore).as('prevPsiMobileScore'),
    })
    .from(sitePathDateAnalytics)
    .where(and(
      ..._where,
      between(sitePathDateAnalytics.date, range.prevPeriod.startDate, range.prevPeriod.endDate),
    ))
    .groupBy(sitePathDateAnalytics.path)
    .as('sq2')

  let finalWhere
  if (filters.includes('improving')) {
    finalWhere = gt(sq.psiDesktopPerformance, sq2.prevPsiDesktopPerformance)
  }
  else if (filters.includes('declining')) {
    finalWhere = gt(sq2.prevPsiDesktopPerformance, sq.psiDesktopPerformance)
  }

  const pagesSelect = useDrizzle().select({
    path: sq.path,
    psiDesktopPerformance: sq.psiDesktopPerformance,
    psiMobilePerformance: sq.psiMobilePerformance,
    psiDesktopSeo: sq.psiDesktopSeo,
    psiMobileSeo: sq.psiMobileSeo,
    psiDesktopAccessibility: sq.psiDesktopAccessibility,
    psiMobileAccessibility: sq.psiMobileAccessibility,
    psiDesktopBestPractices: sq.psiDesktopBestPractices,
    psiMobileBestPractices: sq.psiMobileBestPractices,
    psiDesktopScore: sq.psiDesktopScore,
    psiMobileScore: sq.psiMobileScore,
    prevPsiDesktopPerformance: sq2.prevPsiDesktopPerformance,
    prevPsiMobilePerformance: sq2.prevPsiMobilePerformance,
    prevPsiDesktopSeo: sq2.prevPsiDesktopSeo,
    prevPsiMobileSeo: sq2.prevPsiMobileSeo,
    prevPsiDesktopAccessibility: sq2.prevPsiDesktopAccessibility,
    prevPsiMobileAccessibility: sq2.prevPsiMobileAccessibility,
    prevPsiDesktopBestPractices: sq2.prevPsiDesktopBestPractices,
    prevPsiMobileBestPractices: sq2.prevPsiMobileBestPractices,
    prevPsiDesktopScore: sq2.prevPsiDesktopScore,
    prevPsiMobileScore: sq2.prevPsiMobileScore,
  })
    .from(sq)
    .leftJoin(sq2, eq(sq.path, sq2.path))
    .where(finalWhere)
    .orderBy(sort.column ? (sort.direction === 'asc' ? asc(sq[sort.column]) : desc(sq[sort.column])) : desc(sq.path))
    .as('pagesSelect')

  const pages = await useDrizzle().select()
    .from(pagesSelect)
    .offset(offset)
    .limit(pageSize)

  const totals = await useDrizzle().select({
    count: count().as('total'),
    totalAvgDesktop: avg(sq.psiDesktopScore).as('psiDesktopScore'),
    totalAvgMobile: avg(sq.psiMobileScore).as('psiMobileScore'),
    totalAvgAccessibility: avg(sq.psiMobileAccessibility).as('psiMobileAccessibility'),
    totalAvgBestPractices: avg(sq.psiMobileAccessibility).as('psiMobileBestPractices'),
    totalAvgSeo: avg(sq.psiMobileAccessibility).as('psiMobileBestPractices'),
  })
    .from(pagesSelect)
  return {
    rows: pages.map((row) => {
      row.psiDesktopPerformance = Number(row.psiDesktopPerformance)
      row.psiMobilePerformance = Number(row.psiMobilePerformance)
      row.psiDesktopSeo = Number(row.psiDesktopSeo)
      row.psiMobileSeo = Number(row.psiMobileSeo)
      row.psiDesktopAccessibility = Number(row.psiDesktopAccessibility)
      row.psiMobileAccessibility = Number(row.psiMobileAccessibility)
      row.psiDesktopBestPractices = Number(row.psiDesktopBestPractices)
      row.psiMobileBestPractices = Number(row.psiMobileBestPractices)
      row.psiDesktopScore = Number(row.psiDesktopScore)
      row.psiMobileScore = Number(row.psiMobileScore)
      return row
    }),
    total: totals[0].count,
    avgDesktop: Number(totals[0].totalAvgDesktop),
    avgMobile: Number(totals[0].totalAvgMobile),
  }
})
